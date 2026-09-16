from sqlalchemy.orm import Session
from sqlalchemy import func
from models.facility_admin import HealthDepartment, HealthBed, HealthStaff
import uuid
from datetime import datetime

class FacilityAdminService:
    def __init__(self, db: Session):
        self.db = db

    def get_executive_summary(self, facility_id: str):
        total_beds = self.db.query(func.count(HealthBed.id)).filter(HealthBed.facility_id == facility_id).scalar() or 0
        occupied_beds = self.db.query(func.count(HealthBed.id)).filter(HealthBed.facility_id == facility_id, HealthBed.status == 'occupied').scalar() or 0
        total_staff = self.db.query(func.count(HealthStaff.id)).filter(HealthStaff.facility_id == facility_id).scalar() or 0
        active_staff = self.db.query(func.count(HealthStaff.id)).filter(HealthStaff.facility_id == facility_id, HealthStaff.status == 'active').scalar() or 0
        
        return {
            "patientsToday": 0,
            "bedOccupancy": round((occupied_beds / total_beds * 100) if total_beds > 0 else 0, 1),
            "activeStaff": active_staff,
            "revenuePending": 0
        }

    def create_department(self, facility_id: str, name: str, code: str = None, description: str = None):
        dept = HealthDepartment(
            id=uuid.uuid4(),
            facility_id=facility_id,
            name=name,
            code=code,
            description=description
        )
        self.db.add(dept)
        self.db.commit()
        self.db.refresh(dept)
        return dept

    def get_departments(self, facility_id: str):
        return self.db.query(HealthDepartment).filter(HealthDepartment.facility_id == facility_id).all()

    def get_beds(self, facility_id: str):
        return self.db.query(HealthBed).filter(HealthBed.facility_id == facility_id).all()

    def update_bed_status(self, bed_id: str, status: str):
        bed = self.db.query(HealthBed).filter(HealthBed.id == bed_id).first()
        if bed:
            bed.status = status
            self.db.commit()
            self.db.refresh(bed)
        return bed

    def get_staff(self, facility_id: str, department: str = None, role: str = None, status: str = None):
        query = self.db.query(HealthStaff).filter(HealthStaff.facility_id == facility_id)
        if department: query = query.filter(HealthStaff.department_id == department)
        if role: query = query.filter(HealthStaff.role == role)
        if status: query = query.filter(HealthStaff.status == status)
        return query.all()

    def create_staff(self, facility_id: str, full_name: str, role: str, email: str = None, phone: str = None):
        staff = HealthStaff(
            id=uuid.uuid4(),
            facility_id=facility_id,
            full_name=full_name,
            role=role,
            email=email,
            phone=phone,
            status='active'
        )
        self.db.add(staff)
        self.db.commit()
        self.db.refresh(staff)
        return staff
