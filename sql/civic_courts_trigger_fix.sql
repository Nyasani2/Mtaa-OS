-- FIXED Court-to-Prison handoff trigger only
-- prison_inmates uses jurisdiction_id, NOT court_house_id

DROP TRIGGER IF EXISTS court_to_prison_handoff ON court_cases;
DROP FUNCTION IF EXISTS trg_court_to_prison_handoff();

CREATE OR REPLACE FUNCTION trg_court_to_prison_handoff()
RETURNS TRIGGER AS $$
DECLARE
    v_defendant_id UUID;
    v_facility_id UUID;
    v_inmate_id UUID;
BEGIN
    IF NEW.status = 'sentenced' AND OLD.status != 'sentenced' THEN
        SELECT id INTO v_defendant_id
        FROM court_parties 
        WHERE case_id = NEW.id AND party_type = 'defendant'
        LIMIT 1;

        SELECT id INTO v_facility_id
        FROM prison_facilities
        WHERE jurisdiction_id = NEW.court_house_id
        LIMIT 1;

        IF v_facility_id IS NULL THEN
            SELECT id INTO v_facility_id FROM prison_facilities LIMIT 1;
        END IF;

        IF v_defendant_id IS NOT NULL AND v_facility_id IS NOT NULL THEN
            INSERT INTO prison_inmates (
                jurisdiction_id, facility_id, court_case_id, court_judgment_id,
                inmate_number, full_name, sentence_type, sentence_start,
                sentence_length_months, status, cell_block, created_at, updated_at
            )
            SELECT 
                NEW.court_house_id, v_facility_id, NEW.id, j.id,
                'INM-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6),
                cp.full_name, j.sentence_type, CURRENT_DATE,
                j.sentence_duration_months, 'admitted', 'INTAKE', now(), now()
            FROM court_judgments j
            JOIN court_parties cp ON cp.id = v_defendant_id
            WHERE j.case_id = NEW.id
            ORDER BY j.delivered_date DESC
            LIMIT 1
            RETURNING id INTO v_inmate_id;

            IF v_inmate_id IS NOT NULL THEN
                INSERT INTO prison_movements (
                    inmate_id, from_facility_id, to_facility_id, movement_type,
                    reason, authorized_by, occurred_at, metadata, created_at
                ) VALUES (
                    v_inmate_id, NULL, v_facility_id, 'intake',
                    'Court sentencing from case ' || NEW.case_number,
                    NEW.assigned_judge_id, now(),
                    jsonb_build_object('case_number', NEW.case_number, 'jurisdiction_id', NEW.court_house_id),
                    now()
                );
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER court_to_prison_handoff
    AFTER UPDATE ON court_cases
    FOR EACH ROW
    EXECUTE FUNCTION trg_court_to_prison_handoff();
