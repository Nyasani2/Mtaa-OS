from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from services.facility_admin_service import FacilityAdminService

router = APIRouter(prefix="/facility-admin", tags=["Facility Administration"])

class DepartmentCreate(BaseModel):
    facility_id: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None

class StaffCreate(BaseModel):
    facility_id: str
    full_name: str
    role: str
    email: Optional[str] = None
    phone: Optional[str] = None

class BedStatusUpdate(BaseModel):
    status: str

@router.get("/executive-summary/{facility_id}")
def get_summary(facility_id: str, db: Session = Depends(get_db)):
    service = FacilityAdminService(db)
    return service.get_executive_summary(facility_id)

@router.get("/departments/{facility_id}")
def get_departments(facility_id: str, db: Session = Depends(get_db)):
    service = FacilityAdminService(db)
    return service.get_departments(facility_id)

@router.post("/departments")
def create_department(data: DepartmentCreate, db: Session = Depends(get_db)):
    service = FacilityAdminService(db)
    return service.create_department(data.facility_id, data.name, data.code, data.description)

@router.get("/beds/{facility_id}")
def get_beds(facility_id: str, db: Session = Depends(get_db)):
    service = FacilityAdminService(db)
    return service.get_beds(facility_id)

@router.put("/beds/{bed_id}/status")
def update_bed_status(bed_id: str, data: BedStatusUpdate, db: Session = Depends(get_db)):
    service = FacilityAdminService(db)
    bed = service.update_bed_status(bed_id, data.status)
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    return bed

@router.get("/staff/{facility_id}")
def get_staff(facility_id: str, department: str = None, role: str = None, status: str = None, db: Session = Depends(get_db)):
    service = FacilityAdminService(db)
    return service.get_staff(facility_id, department, role, status)

@router.post("/staff")
def create_staff(data: StaffCreate, db: Session = Depends(get_db)):
    service = FacilityAdminService(db)
    return service.create_staff(data.facility_id, data.full_name, data.role, data.email, data.phone)
