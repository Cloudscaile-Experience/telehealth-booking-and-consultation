from enum import StrEnum


class ProviderSpecialty(StrEnum):
    GENERAL_PRACTITIONER = "general_practitioner"
    CARDIOLOGIST = "cardiologist"
    DERMATOLOGIST = "dermatologist"
    ENDOCRINOLOGIST = "endocrinologist"
    NEUROLOGIST = "neurologist"
    ONCOLOGIST = "oncologist"
    ORTHOPEDIST = "orthopedist"
    PEDIATRICIAN = "pediatrician"
    PSYCHIATRIST = "psychiatrist"
    PSYCHOLOGIST = "psychologist"
    RADIOLOGIST = "radiologist"
    THERAPIST = "therapist"


class BookingStatus(StrEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class ConsultationStatus(StrEnum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
