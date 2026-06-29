"""
Seed script — populates the database with realistic telehealth data.

Usage:
    uv run python seed/seed.py            # seed (skips if data exists)
    uv run python seed/seed.py --reset    # truncate all tables, then seed
"""

from __future__ import annotations

import asyncio
import sys
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, text

from telehealth.db.models.availability_slot import AvailabilitySlot
from telehealth.db.models.booking import Booking
from telehealth.db.models.consultation import Consultation
from telehealth.db.models.provider import Provider
from telehealth.db.session import AsyncSessionManager
from telehealth.utils.config import get_settings
from telehealth.utils.constants import BookingStatus, ConsultationStatus, ProviderSpecialty

# ── Helpers ───────────────────────────────────────────────────────────────────

NOW = datetime.now(tz=UTC)


def _dt(days: int = 0, hour: int = 9, minute: int = 0) -> datetime:
    base = NOW.replace(hour=hour, minute=minute, second=0, microsecond=0)
    return base + timedelta(days=days)


def _past(days: int = 0, hour: int = 10) -> datetime:
    return _dt(-days, hour)


# ── Provider fixtures ─────────────────────────────────────────────────────────

PROVIDERS: list[dict[str, object]] = [
    {
        "name": "Dr. Sarah Chen",
        "email": "sarah.chen@telehealth.example.com",
        "specialty": ProviderSpecialty.CARDIOLOGIST,
        "bio": (
            "Dr. Chen is a board-certified cardiologist with 14 years of experience "
            "treating heart disease, arrhythmias, and hypertension. She completed her "
            "fellowship at Johns Hopkins Hospital and speaks Mandarin and English."
        ),
        "avatar_url": "https://i.pravatar.cc/200?img=47",
        "languages": "English, Mandarin",
        "rating": 4.9,
        "consultation_fee": 180.0,
    },
    {
        "name": "Dr. Marcus Williams",
        "email": "marcus.williams@telehealth.example.com",
        "specialty": ProviderSpecialty.GENERAL_PRACTITIONER,
        "bio": (
            "Dr. Williams is a family medicine physician focused on preventive care and "
            "chronic disease management. With 10 years in primary care, he builds "
            "long-term relationships with patients of all ages."
        ),
        "avatar_url": "https://i.pravatar.cc/200?img=12",
        "languages": "English, Spanish",
        "rating": 4.7,
        "consultation_fee": 95.0,
    },
    {
        "name": "Dr. Priya Nair",
        "email": "priya.nair@telehealth.example.com",
        "specialty": ProviderSpecialty.DERMATOLOGIST,
        "bio": (
            "Dr. Nair specialises in medical and cosmetic dermatology, including acne, "
            "eczema, psoriasis, and skin cancer screening. She trained at AIIMS New Delhi "
            "and completed her residency at Stanford."
        ),
        "avatar_url": "https://i.pravatar.cc/200?img=23",
        "languages": "English, Hindi, Malayalam",
        "rating": 4.8,
        "consultation_fee": 140.0,
    },
    {
        "name": "Dr. James Okafor",
        "email": "james.okafor@telehealth.example.com",
        "specialty": ProviderSpecialty.PSYCHIATRIST,
        "bio": (
            "Dr. Okafor is a psychiatrist with expertise in mood disorders, anxiety, "
            "ADHD, and trauma-informed care. He uses evidence-based approaches including "
            "CBT and medication management for adults and adolescents."
        ),
        "avatar_url": "https://i.pravatar.cc/200?img=33",
        "languages": "English, Yoruba",
        "rating": 4.9,
        "consultation_fee": 160.0,
    },
    {
        "name": "Dr. Yuki Tanaka",
        "email": "yuki.tanaka@telehealth.example.com",
        "specialty": ProviderSpecialty.ENDOCRINOLOGIST,
        "bio": (
            "Dr. Tanaka focuses on diabetes management, thyroid disorders, and metabolic "
            "conditions. She completed her endocrinology fellowship at Mayo Clinic and "
            "has published research on insulin resistance."
        ),
        "avatar_url": "https://i.pravatar.cc/200?img=56",
        "languages": "English, Japanese",
        "rating": 4.8,
        "consultation_fee": 165.0,
    },
    {
        "name": "Dr. Elena Vasquez",
        "email": "elena.vasquez@telehealth.example.com",
        "specialty": ProviderSpecialty.NEUROLOGIST,
        "bio": (
            "Dr. Vasquez is a neurologist specialising in headache disorders, epilepsy, "
            "and multiple sclerosis. She leads a headache clinic and is passionate about "
            "patient education and quality-of-life outcomes."
        ),
        "avatar_url": "https://i.pravatar.cc/200?img=44",
        "languages": "English, Spanish, Portuguese",
        "rating": 4.7,
        "consultation_fee": 175.0,
    },
    {
        "name": "Dr. Liam O'Brien",
        "email": "liam.obrien@telehealth.example.com",
        "specialty": ProviderSpecialty.ORTHOPEDIST,
        "bio": (
            "Dr. O'Brien is an orthopaedic surgeon with expertise in sports injuries, "
            "joint replacement, and spine care. He has worked with professional athletes "
            "and is an advocate for minimally invasive surgical techniques."
        ),
        "avatar_url": "https://i.pravatar.cc/200?img=7",
        "languages": "English",
        "rating": 4.6,
        "consultation_fee": 190.0,
    },
    {
        "name": "Dr. Amara Diallo",
        "email": "amara.diallo@telehealth.example.com",
        "specialty": ProviderSpecialty.PEDIATRICIAN,
        "bio": (
            "Dr. Diallo is a board-certified paediatrician who cares for children from "
            "birth through adolescence. She is known for her warm, family-centred approach "
            "and fluency in French, enabling care for Francophone families."
        ),
        "avatar_url": "https://i.pravatar.cc/200?img=29",
        "languages": "English, French",
        "rating": 4.9,
        "consultation_fee": 110.0,
    },
    {
        "name": "Dr. Raj Patel",
        "email": "raj.patel@telehealth.example.com",
        "specialty": ProviderSpecialty.PSYCHOLOGIST,
        "bio": (
            "Dr. Patel is a clinical psychologist specialising in cognitive-behavioural "
            "therapy, mindfulness-based interventions, and stress management. He works "
            "with adults dealing with anxiety, depression, and burnout."
        ),
        "avatar_url": "https://i.pravatar.cc/200?img=18",
        "languages": "English, Gujarati",
        "rating": 4.8,
        "consultation_fee": 130.0,
    },
    {
        "name": "Dr. Nina Johansson",
        "email": "nina.johansson@telehealth.example.com",
        "specialty": ProviderSpecialty.THERAPIST,
        "bio": (
            "Dr. Johansson is a licensed therapist with 12 years of experience in couples "
            "therapy, grief counselling, and trauma recovery. She practices an integrative "
            "approach drawing from psychodynamic and somatic therapies."
        ),
        "avatar_url": "https://i.pravatar.cc/200?img=39",
        "languages": "English, Swedish",
        "rating": 4.9,
        "consultation_fee": 120.0,
    },
]

# ── Slot generation ───────────────────────────────────────────────────────────

SLOT_HOURS = [9, 10, 11, 14, 15, 16]  # 9 AM-11 AM, 2 PM-4 PM (30-min sessions)


def _generate_slots(provider_id: uuid.UUID, days_ahead: int = 28) -> list[dict[str, object]]:
    """Generate 30-minute slots on weekdays over the next `days_ahead` days."""
    slots: list[dict[str, object]] = []
    for day_offset in range(1, days_ahead + 1):
        target = NOW + timedelta(days=day_offset)
        if target.weekday() >= 5:  # skip weekends
            continue
        for hour in SLOT_HOURS:
            start = target.replace(hour=hour, minute=0, second=0, microsecond=0)
            slots.append(
                {
                    "id": uuid.uuid4(),
                    "provider_id": provider_id,
                    "start_time": start,
                    "end_time": start + timedelta(minutes=30),
                    "is_booked": False,
                }
            )
    return slots


# ── Patient fixtures (external IDs from JWT sub) ──────────────────────────────

PATIENTS = [
    "patient-001-alice-morgan",
    "patient-002-bob-hayes",
    "patient-003-clara-stone",
    "patient-004-david-kim",
    "patient-005-eva-muller",
    "patient-006-frank-nguyen",
]

# ── Consultation summaries by specialty ───────────────────────────────────────

SUMMARIES: dict[ProviderSpecialty, str] = {
    ProviderSpecialty.CARDIOLOGIST: (
        "Patient presents with controlled hypertension. BP reading 128/82 mmHg. "
        "Current medication (lisinopril 10 mg) maintained. Advised 30-minute daily "
        "cardio exercise and reduced sodium intake. Follow-up in 3 months."
    ),
    ProviderSpecialty.GENERAL_PRACTITIONER: (
        "Annual wellness visit. BMI 23.4, vitals within normal range. Flu and Tdap "
        "vaccinations administered. Discussed sleep hygiene and stress management. "
        "Routine blood panel ordered; results expected within 5 business days."
    ),
    ProviderSpecialty.DERMATOLOGIST: (
        "Evaluated two mildly irregular moles on the upper back. Dermoscopy findings "
        "benign. Prescribed hydrocortisone 1% cream for localised eczema patch on "
        "forearm. SPF 50 sunscreen strongly recommended. Review in 6 months."
    ),
    ProviderSpecialty.PSYCHIATRIST: (
        "Patient reports improved mood stability since starting sertraline 50 mg. "
        "No suicidal ideation. Sleep quality improving. Dose maintained; added "
        "psychoeducation on CBT techniques for rumination. Next session in 4 weeks."
    ),
    ProviderSpecialty.ENDOCRINOLOGIST: (
        "HbA1c down to 6.8% from 7.4% last quarter — excellent progress. Metformin "
        "500 mg twice daily continued. Recommended continuous glucose monitoring. "
        "Dietitian referral placed. Next review in 3 months."
    ),
    ProviderSpecialty.NEUROLOGIST: (
        "Chronic migraine frequency reduced to 4 episodes/month with topiramate 50 mg. "
        "Patient tolerating medication well. Sumatriptan 50 mg prescribed for acute "
        "episodes. Lifestyle triggers (screen time, hydration) reviewed."
    ),
    ProviderSpecialty.ORTHOPEDIST: (
        "Right knee MRI reviewed — grade II medial meniscus tear. Conservative management "
        "recommended: physiotherapy 3x/week for 6 weeks. NSAIDs as needed. Surgical "
        "intervention deferred pending PT response. Follow-up in 6 weeks."
    ),
    ProviderSpecialty.PEDIATRICIAN: (
        "18-month well-child visit. Growth at 60th percentile for height and weight. "
        "MMR and varicella vaccines administered. Developmental milestones on track. "
        "Discussed transitioning to whole milk and introduction of varied solids."
    ),
    ProviderSpecialty.PSYCHOLOGIST: (
        "Session focused on cognitive restructuring for catastrophic thinking patterns. "
        "Patient practised thought records and reported applying techniques successfully "
        "at work. Assigned daily 5-minute mindfulness exercise. Continue weekly sessions."
    ),
    ProviderSpecialty.THERAPIST: (
        "Couple presents with improved communication since implementing agreed-upon "
        "'check-in' ritual. Explored underlying attachment needs. Assigned active "
        "listening exercise for the coming week. Progress is encouraging."
    ),
}

PROVIDER_NOTES_BY_SPECIALTY: dict[ProviderSpecialty, str] = {
    ProviderSpecialty.CARDIOLOGIST: "ECG trace reviewed — normal sinus rhythm. No red flags.",
    ProviderSpecialty.GENERAL_PRACTITIONER: "No acute concerns. Preventive care on track.",
    ProviderSpecialty.DERMATOLOGIST: "Lesions photographed and filed. No biopsy indicated.",
    ProviderSpecialty.PSYCHIATRIST: "Patient engaged well. Risk assessment: low.",
    ProviderSpecialty.ENDOCRINOLOGIST: "Labs reviewed. A1c trend positive.",
    ProviderSpecialty.NEUROLOGIST: "Headache diary reviewed. Frequency trending down.",
    ProviderSpecialty.ORTHOPEDIST: "ROM assessment: 0-115 degrees. PT referral placed.",
    ProviderSpecialty.PEDIATRICIAN: "All milestones met. Parents reassured.",
    ProviderSpecialty.PSYCHOLOGIST: "Good insight. Homework compliance excellent.",
    ProviderSpecialty.THERAPIST: "Both partners engaged and motivated.",
}

PATIENT_NOTES_EXAMPLES = [
    "I've been experiencing these symptoms for about two weeks now.",
    "Feeling much better compared to last visit, energy levels are up.",
    "Still having some discomfort but manageable with the prescribed medication.",
    "Very pleased with the progress. The exercises are helping.",
    "Slightly anxious about the results but overall feeling hopeful.",
    "No new symptoms. Continuing the recommended diet changes.",
]

# ── Main seeder ───────────────────────────────────────────────────────────────


async def seed(reset: bool = False) -> None:
    settings = get_settings()
    manager = AsyncSessionManager()
    await manager.init(settings.database_url)

    async with manager.session() as session:
        # Check whether the schema exists at all (migrations may not have run yet).
        tables_exist_result = await session.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = 'providers'"
            )
        )
        tables_exist = (tables_exist_result.scalar() or 0) > 0

        if not tables_exist:
            print("Schema not found. Run migrations first: uv run alembic upgrade head")
            await manager.close()
            return

        if reset:
            print("Resetting tables …")
            await session.execute(text("TRUNCATE TABLE consultations, bookings, availability_slots, providers CASCADE"))
            print("Tables cleared.")
        else:
            existing = (await session.execute(select(Provider).limit(1))).scalar_one_or_none()
            if existing:
                print("Seed data already present. Pass --reset to re-seed.")
                await manager.close()
                return

        # ── 1. Providers ──────────────────────────────────────────────────────
        print("Seeding providers …")
        provider_records: list[Provider] = []
        for p in PROVIDERS:
            specialty = ProviderSpecialty(p["specialty"])
            record = Provider(
                id=uuid.uuid4(),
                name=p["name"],
                email=p["email"],
                specialty=specialty.value,
                bio=p["bio"],
                avatar_url=p["avatar_url"],
                languages=p["languages"],
                rating=p["rating"],
                consultation_fee=p["consultation_fee"],
                is_active=True,
            )
            session.add(record)
            provider_records.append(record)

        await session.flush()

        # ── 2. Availability slots ─────────────────────────────────────────────
        print("Seeding availability slots …")
        all_slots: list[AvailabilitySlot] = []
        for provider in provider_records:
            for slot_data in _generate_slots(provider.id):
                slot = AvailabilitySlot(
                    id=slot_data["id"],
                    provider_id=provider.id,
                    start_time=slot_data["start_time"],
                    end_time=slot_data["end_time"],
                    is_booked=False,
                )
                session.add(slot)
                all_slots.append(slot)

        await session.flush()

        # ── 3. Bookings & consultations ───────────────────────────────────────
        print("Seeding bookings and consultations …")

        # Map provider id → specialty for summary lookup
        specialty_map: dict[uuid.UUID, ProviderSpecialty] = {
            r.id: ProviderSpecialty(r.specialty) for r in provider_records
        }

        # Group slots by provider
        slots_by_provider: dict[uuid.UUID, list[AvailabilitySlot]] = {}
        for slot in all_slots:
            slots_by_provider.setdefault(slot.provider_id, []).append(slot)

        patient_idx = 0

        for provider in provider_records:
            provider_slots = slots_by_provider.get(provider.id, [])
            if not provider_slots:
                continue

            specialty = specialty_map[provider.id]

            # Pick 5 slots spread across the available pool
            step = max(1, len(provider_slots) // 5)
            chosen = provider_slots[::step][:5]

            for i, slot in enumerate(chosen):
                patient_id = PATIENTS[patient_idx % len(PATIENTS)]
                patient_idx += 1

                # Rotate through booking statuses for variety
                statuses = [
                    BookingStatus.COMPLETED,
                    BookingStatus.CONFIRMED,
                    BookingStatus.PENDING,
                    BookingStatus.CANCELLED,
                    BookingStatus.COMPLETED,
                ]
                status = statuses[i % len(statuses)]

                slot.is_booked = True

                booking = Booking(
                    id=uuid.uuid4(),
                    patient_id=patient_id,
                    provider_id=provider.id,
                    slot_id=slot.id,
                    status=status,
                    patient_notes=PATIENT_NOTES_EXAMPLES[i % len(PATIENT_NOTES_EXAMPLES)],
                )
                session.add(booking)
                await session.flush()

                # Attach a consultation to completed/confirmed bookings
                if status in (BookingStatus.COMPLETED, BookingStatus.CONFIRMED):
                    c_status = (
                        ConsultationStatus.COMPLETED
                        if status == BookingStatus.COMPLETED
                        else ConsultationStatus.SCHEDULED
                    )
                    started_at = slot.start_time if c_status == ConsultationStatus.COMPLETED else None
                    ended_at = slot.end_time if c_status == ConsultationStatus.COMPLETED else None

                    consultation = Consultation(
                        id=uuid.uuid4(),
                        booking_id=booking.id,
                        video_session_id=f"vs-{uuid.uuid4().hex[:12]}",
                        video_session_token=None,
                        status=c_status,
                        started_at=started_at,
                        ended_at=ended_at,
                        provider_notes=(
                            PROVIDER_NOTES_BY_SPECIALTY.get(specialty)
                            if c_status == ConsultationStatus.COMPLETED
                            else None
                        ),
                        patient_notes=(
                            PATIENT_NOTES_EXAMPLES[i % len(PATIENT_NOTES_EXAMPLES)]
                            if c_status == ConsultationStatus.COMPLETED
                            else None
                        ),
                        summary=(SUMMARIES.get(specialty) if c_status == ConsultationStatus.COMPLETED else None),
                    )
                    session.add(consultation)

        await session.flush()

    provider_count = len(provider_records)
    slot_count = len(all_slots)
    print(
        f"Done. Seeded {provider_count} providers, "
        f"{slot_count} availability slots, "
        f"~{provider_count * 5} bookings with consultations."
    )

    await manager.close()


if __name__ == "__main__":
    asyncio.run(seed(reset="--reset" in sys.argv))
