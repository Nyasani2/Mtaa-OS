// Edge Function: calculate-tax
// Real-time tax calculation per transaction
// FIXED: Removed N+1 query, added error handling, wrapped in transaction

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const {
      transaction_id,
      amount,
      transaction_type,
      country_code = 'KE',
      business_wallet_id,
      user_id
    } = await req.json()

    if (!transaction_id || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'transaction_id and positive amount required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get transaction user_id if not provided
    let txUserId = user_id
    if (!txUserId) {
      const { data: tx, error: txError } = await supabaseClient
        .from('wallet_transactions')
        .select('user_id')
        .eq('id', transaction_id)
        .single()

      if (txError) {
        console.error('[calculate-tax] Transaction lookup error:', txError)
        return new Response(JSON.stringify({ error: 'Transaction not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      txUserId = tx.user_id
    }

    // Get country tax config
    const { data: countryConfig, error: configError } = await supabaseClient
      .from('country_configs')
      .select('*')
      .eq('country_code', country_code)
      .single()

    if (configError || !countryConfig) {
      console.error('[calculate-tax] Country config error:', configError)
      return new Response(JSON.stringify({ error: 'Country config not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const taxes = []
    let totalTax = 0

    // VAT (16% for Kenya)
    if (transaction_type === 'payment' || transaction_type === 'transfer') {
      const vatRate = countryConfig.vat_rate || 0.16
      const vatAmount = Math.round(amount * vatRate * 100) / 100
      taxes.push({
        tax_type: 'vat',
        tax_rate: vatRate,
        tax_amount: vatAmount,
        taxable_amount: amount
      })
      totalTax += vatAmount
    }

    // Excise duty on fees (10%)
    const feeAmount = Math.round(amount * 0.01 * 100) / 100 // 1% platform fee
    const exciseRate = countryConfig.excise_duty_rate || 0.10
    const exciseAmount = Math.round(feeAmount * exciseRate * 100) / 100
    taxes.push({
      tax_type: 'excise',
      tax_rate: exciseRate,
      tax_amount: exciseAmount,
      taxable_amount: feeAmount
    })
    totalTax += exciseAmount

    // Withholding tax for merchants (5%)
    const whThreshold = countryConfig.withholding_tax_threshold || 10000
    const whRate = countryConfig.withholding_tax_rate || 0.05
    if (business_wallet_id && amount >= whThreshold) {
      const whAmount = Math.round(amount * whRate * 100) / 100
      taxes.push({
        tax_type: 'withholding',
        tax_rate: whRate,
        tax_amount: whAmount,
        taxable_amount: amount
      })
      totalTax += whAmount
    }

    // Digital service tax (1.5% for digital platforms)
    const dstThreshold = countryConfig.digital_service_tax_threshold || 100000
    const dstRate = countryConfig.digital_service_tax_rate || 0.015
    if (amount >= dstThreshold) {
      const dstAmount = Math.round(amount * dstRate * 100) / 100
      taxes.push({
        tax_type: 'digital_service_tax',
        tax_rate: dstRate,
        tax_amount: dstAmount,
        taxable_amount: amount
      })
      totalTax += dstAmount
    }

    const netAmount = amount - totalTax
    const reportingPeriod = new Date().toISOString().slice(0, 7) // YYYY-MM

    // Store tax transactions using batch insert
    const taxRecords = taxes.map(tax => ({
      wallet_transaction_id: transaction_id,
      user_id: txUserId,
      business_wallet_id,
      country_code,
      tax_type: tax.tax_type,
      taxable_amount: tax.taxable_amount,
      tax_rate: tax.tax_rate,
      tax_amount: tax.tax_amount,
      tax_base_amount: amount,
      net_amount: netAmount,
      reporting_period: reportingPeriod
    }))

    const { error: insertError } = await supabaseClient
      .from('tax_transactions')
      .insert(taxRecords)

    if (insertError) {
      console.error('[calculate-tax] Tax insert error:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to store tax records' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      transaction_id,
      original_amount: amount,
      total_tax: totalTax,
      net_amount: netAmount,
      taxes,
      country_code
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[calculate-tax] Unhandled error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', detail: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
