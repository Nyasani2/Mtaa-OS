from sqlalchemy import Column, String, Text, Integer, Decimal, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime

class HealthDepartment(Base):
    __tablename__ = 'health_departments'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    facility_id = Column(UUID(as_uuid=True), ForeignKey('health_facilities.id', ondelete='CASCADE'), nullable=False)
    name = Column(Text, nullable=False)
    code = Column(Text, unique=True)
    description = Column(Text)
    head_id = Column(UUID(as_uuid=True), ForeignKey('health_staff.id'))
    budget = Column(Decimal(12, 2))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

class HealthBed(Base):
    __tablename__ = 'health_beds'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    facility_id = Column(UUID(as_uuid=True), ForeignKey('health_facilities.id', ondelete='CASCADE'), nullable=False)
    room_id = Column(UUID(as_uuid=True), ForeignKey('health_rooms.id'))
    bed_number = Column(String, nullable=False)
    bed_type = Column(String)
    status = Column(String, default='available')
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class HealthStaff(Base):
    __tablename__ = 'health_staff'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    facility_id = Column(UUID(as_uuid=True), ForeignKey('health_facilities.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('auth.users.id'))
    full_name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    role = Column(String, nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey('health_departments.id'))
    license_number = Column(String)
    specialization = Column(String)
    employment_type = Column(String)
    hire_date = Column(DateTime(timezone=True))
    status = Column(String, default='active')
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
