from enum import Enum


class ProviderSpecialty(str, Enum):
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


class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class ConsultationStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
