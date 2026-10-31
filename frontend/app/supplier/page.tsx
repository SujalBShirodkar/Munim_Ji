'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { Building2, Package, Truck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function SupplierPortalPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const loadOrders = async () => {
    try {
      const data = await api.getSupplierOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleDispatch = async (id: string) => {
    try {
      await api.dispatchSupplierOrder(id);
      setActionMsg(`Order ${id} marked as DISPATCHED.`);
      loadOrders();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeliver = async (id: string) => {
    try {
      await api.deliverSupplierOrder(id);
      setActionMsg(`Order ${id} DELIVERED! Measured savings recorded for all member merchants.`);
      loadOrders();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-ink dark:text-white flex items-center gap-2">
              <Building2 className="text-paytm-cyan" size={22} />
              Wholesale Supplier Portal
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Maharashtra Agro Wholesale & Western Syndicate
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
            Supplier View
          </span>
        </div>

        {actionMsg && (
          <div className="p-3 rounded-xl bg-mint-light text-mint-dark text-xs font-bold border border-mint/40">
            ✓ {actionMsg}
          </div>
        )}

        {/* Incoming Orders */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            Incoming Pooled Orders ({orders.length})
          </h3>

          {orders.map((o) => (
            <div
              key={o.id || o._id}
              className="p-4 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-paytm-cyan bg-paytm-cyan/10 px-2 py-0.5 rounded-full">
                    State: {o.state}
                  </span>
                  <h4 className="text-sm font-black text-ink dark:text-white mt-1">
                    {o.product_name}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Pooled: {o.current_qty} / {o.threshold_qty} {o.unit}s
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                {o.state === 'OPEN' || o.state === 'CONFIRMED' ? (
                  <button
                    onClick={() => handleDispatch(o.id || o._id)}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Truck size={14} />
                    <span>Mark Dispatched</span>
                  </button>
                ) : null}

                {o.state === 'DISPATCHED' ? (
                  <button
                    onClick={() => handleDeliver(o.id || o._id)}
                    className="flex-1 py-2 rounded-xl bg-mint hover:bg-mint-dark text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    <span>Confirm Delivery (Record Savings)</span>
                  </button>
                ) : null}

                {o.state === 'DELIVERED' ? (
                  <div className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-center font-bold text-xs">
                    ✓ Order Delivered & Measured
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

