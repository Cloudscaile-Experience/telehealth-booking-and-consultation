# Import all models here so SQLAlchemy's mapper registry knows about them
# before Alembic autogenerate or application startup resolves relationships.
from telehealth.db.models.availability_slot import AvailabilitySlot
from telehealth.db.models.booking import Booking
from telehealth.db.models.consultation import Consultation
from telehealth.db.models.provider import Provider

__all__ = ["AvailabilitySlot", "Booking", "Consultation", "Provider"]
