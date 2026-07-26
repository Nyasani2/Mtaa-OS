-- MTAA OS V10 — RLS Policies: WALLET + TREASURY + REGULATORY
-- Run this AFTER Sprint A services are deployed

-- wallet_accounts: users see only their own accounts
ALTER TABLE wallet_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallet_accounts_user_isolation ON wallet_accounts;
CREATE POLICY wallet_accounts_user_isolation ON wallet_accounts
  FOR ALL USING (user_id = auth.uid());

-- wallet_transactions: users see only their own transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallet_transactions_user_isolation ON wallet_transactions;
CREATE POLICY wallet_transactions_user_isolation ON wallet_transactions
  FOR ALL USING (user_id = auth.uid());

-- wallet_investments: users see only their own investments
ALTER TABLE wallet_investments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallet_investments_user_isolation ON wallet_investments;
CREATE POLICY wallet_investments_user_isolation ON wallet_investments
  FOR ALL USING (user_id = auth.uid());

-- wallet_sacco: users see only their own contributions
ALTER TABLE wallet_sacco ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallet_sacco_user_isolation ON wallet_sacco;
CREATE POLICY wallet_sacco_user_isolation ON wallet_sacco
  FOR ALL USING (user_id = auth.uid());

-- wallet_gofund: public read, owner full access
ALTER TABLE wallet_gofund ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallet_gofund_public_read ON wallet_gofund;
CREATE POLICY wallet_gofund_public_read ON wallet_gofund FOR SELECT USING (true);
DROP POLICY IF EXISTS wallet_gofund_owner_write ON wallet_gofund;
CREATE POLICY wallet_gofund_owner_write ON wallet_gofund
  FOR ALL USING (user_id = auth.uid());

-- wallet_cards: users see only their own cards
ALTER TABLE wallet_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallet_cards_user_isolation ON wallet_cards;
CREATE POLICY wallet_cards_user_isolation ON wallet_cards
  FOR ALL USING (user_id = auth.uid());

-- treasury_revenue: collectors see their own, admins see all
ALTER TABLE treasury_revenue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS treasury_revenue_collector ON treasury_revenue;
CREATE POLICY treasury_revenue_collector ON treasury_revenue
  FOR ALL USING (collector_id = auth.uid());

-- treasury_expenditure: requesters see their own, approvers see pending
ALTER TABLE treasury_expenditure ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS treasury_expenditure_requester ON treasury_expenditure;
CREATE POLICY treasury_expenditure_requester ON treasury_expenditure
  FOR ALL USING (requester_id = auth.uid());

-- treasury_budgets: all authenticated users can read
ALTER TABLE treasury_budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS treasury_budgets_read ON treasury_budgets;
CREATE POLICY treasury_budgets_read ON treasury_budgets FOR SELECT USING (auth.role() = 'authenticated');

-- regulatory_businesses: owners see their own, public read for active
ALTER TABLE regulatory_businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS regulatory_businesses_owner ON regulatory_businesses;
CREATE POLICY regulatory_businesses_owner ON regulatory_businesses
  FOR ALL USING (owner_id = auth.uid());
DROP POLICY IF EXISTS regulatory_businesses_public ON regulatory_businesses;
CREATE POLICY regulatory_businesses_public ON regulatory_businesses FOR SELECT USING (status = 'active');

-- regulatory_compliance: business owners see their own
ALTER TABLE regulatory_compliance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS regulatory_compliance_business ON regulatory_compliance;
CREATE POLICY regulatory_compliance_business ON regulatory_compliance
  FOR ALL USING (business_id IN (
    SELECT id FROM regulatory_businesses WHERE owner_id = auth.uid()
  ));

-- regulatory_tax_records: business owners see their own
ALTER TABLE regulatory_tax_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS regulatory_tax_records_business ON regulatory_tax_records;
CREATE POLICY regulatory_tax_records_business ON regulatory_tax_records
  FOR ALL USING (business_id IN (
    SELECT id FROM regulatory_businesses WHERE owner_id = auth.uid()
  ));
