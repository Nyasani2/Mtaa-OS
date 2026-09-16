-- Kitchen & Cafeteria Management Tables
-- Run this in Supabase SQL Editor

-- Patient meal plans and dietary management
CREATE TABLE IF NOT EXISTS health_kitchen_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_name VARCHAR(255) NOT NULL,
    patient_name VARCHAR(255),
    meal_type VARCHAR(50) NOT NULL, -- Breakfast, Lunch, Dinner, Snack
    scheduled_time TIME NOT NULL,
    scheduled_date DATE DEFAULT CURRENT_DATE,
    dietary_notes TEXT,
    calories INTEGER,
    status VARCHAR(50) DEFAULT 'planned', -- planned, prepared, served, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Kitchen inventory tracking
CREATE TABLE IF NOT EXISTS health_kitchen_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL, -- kg, liters, pieces, etc.
    category VARCHAR(100), -- vegetables, meat, dairy, grains, etc.
    expiry_date DATE,
    min_stock_level DECIMAL(10,2) DEFAULT 10,
    supplier_name VARCHAR(255),
    last_ordered DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dietary restrictions and allergies
CREATE TABLE IF NOT EXISTS health_dietary_restrictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_name VARCHAR(255) NOT NULL,
    patient_id UUID REFERENCES health_patients(id),
    restriction_type VARCHAR(100) NOT NULL, -- Allergy, Diabetic, Vegetarian, etc.
    description TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'medium', -- mild, medium, severe, critical
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Staff cafeteria menu
CREATE TABLE IF NOT EXISTS health_cafeteria_menu (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_name VARCHAR(255) NOT NULL,
    meal_type VARCHAR(50), -- Breakfast, Lunch, Dinner
    serving_date DATE NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_meals_date ON health_kitchen_meals(scheduled_date, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_meals_patient ON health_kitchen_meals(patient_name);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON health_kitchen_inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON health_kitchen_inventory(quantity) WHERE quantity < min_stock_level;
CREATE INDEX IF NOT EXISTS idx_dietary_patient ON health_dietary_restrictions(patient_id);

-- Create updated_at triggers
CREATE TRIGGER update_kitchen_meals_updated_at BEFORE UPDATE ON health_kitchen_meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kitchen_inventory_updated_at BEFORE UPDATE ON health_kitchen_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dietary_restrictions_updated_at BEFORE UPDATE ON health_dietary_restrictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample dietary restrictions
INSERT INTO health_dietary_restrictions (patient_name, restriction_type, description, severity) VALUES
('General', 'Vegetarian', 'No meat or fish products', 'medium'),
('General', 'Vegan', 'No animal products whatsoever', 'medium'),
('General', 'Diabetic', 'Low sugar, controlled carbohydrates', 'high'),
('General', 'Gluten-Free', 'No wheat, barley, or rye products', 'high'),
('General', 'Low Sodium', 'Reduced salt intake', 'medium')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE health_kitchen_meals IS 'Patient meal planning and scheduling';
COMMENT ON TABLE health_kitchen_inventory IS 'Kitchen stock and ingredient tracking';
COMMENT ON TABLE health_dietary_restrictions IS 'Patient dietary restrictions and allergies';
COMMENT ON TABLE health_cafeteria_menu IS 'Staff cafeteria daily menu';
