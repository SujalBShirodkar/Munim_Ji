const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMsg = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.message || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  requestOtp: (phone: string) => fetchApi<any>('/auth/otp/request', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (phone: string, otp: string) => fetchApi<any>('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone, otp }) }),
  getMe: () => fetchApi<any>('/auth/me'),
  logout: () => fetchApi<any>('/auth/logout', { method: 'POST' }),

  // Merchant & Catalogue
  getProfile: () => fetchApi<any>('/merchants/me'),
  getCatalogue: () => fetchApi<any[]>('/merchants/catalogue'),

  // Analytics
  getTransactions: (limit = 30) => fetchApi<any[]>(`/transactions?limit=${limit}`),
  getSalesSummary: (period = 'today') => fetchApi<any>(`/analytics/summary?period=${period}`),
  getHourlySales: (date = 'today') => fetchApi<any[]>(`/analytics/hourly?date=${date}`),
  getInventory: () => fetchApi<any>('/analytics/inventory'),
  getSettlements: () => fetchApi<any>('/analytics/settlements'),

  // Assistant
  getBriefing: () => fetchApi<any>('/assistant/briefing'),
  sendChatMessage: (query: string, language = 'hi', history: any[] = []) =>
    fetchApi<any>('/assistant/chat', { method: 'POST', body: JSON.stringify({ query, language, history }) }),

  // Simulator
  runWhatIf: (data: any) => fetchApi<any>('/whatif/run', { method: 'POST', body: JSON.stringify(data) }),

  // Pooling
  getPoolGroups: (product?: string) => fetchApi<any[]>(`/pool/groups${product ? `?product=${product}` : ''}`),
  getPoolGroupDetail: (id: string) => fetchApi<any>(`/pool/groups/${id}`),
  postNeed: (data: any) => fetchApi<any>('/pool/needs', { method: 'POST', body: JSON.stringify(data) }),
  joinGroup: (id: string, qty: number) =>
    fetchApi<any>(`/pool/groups/${id}/join`, { method: 'POST', body: JSON.stringify({ qty, confirmed: true }) }),

  // Lending
  getCreditOffer: () => fetchApi<any>('/credit/offer'),
  getCreditKfs: (amount = 5000) => fetchApi<any>(`/credit/kfs?amount=${amount}`),
  acceptCredit: (amount_rupees = 5000, otp_code = '123456') =>
    fetchApi<any>('/credit/accept', { method: 'POST', body: JSON.stringify({ amount_rupees, confirmed_kfs: true, otp_code }) }),
  getCreditLedger: () => fetchApi<any>('/credit/ledger'),
  prepayCredit: (amount_rupees: number) =>
    fetchApi<any>('/credit/prepay', { method: 'POST', body: JSON.stringify({ amount_rupees }) }),

  // Payments & Paytm
  initiatePayment: (order_id: string, amount_rupees: number, purpose = 'customer_payment', merchant_id?: string) =>
    fetchApi<any>('/payments/paytm/initiate', { method: 'POST', body: JSON.stringify({ order_id, amount_rupees, purpose, merchant_id }) }),
  getPaymentStatus: (order_id: string) => fetchApi<any>(`/payments/${order_id}/status`),
  triggerMockWebhook: (payload: any) =>
    fetchApi<any>('/payments/paytm/webhook', { method: 'POST', body: JSON.stringify(payload) }),

  // Savings
  getSavingsReport: () => fetchApi<any>('/savings/report'),

  // Supplier
  getSupplierOrders: () => fetchApi<any[]>('/supplier/orders'),
  dispatchSupplierOrder: (id: string) => fetchApi<any>(`/supplier/orders/${id}/dispatch`, { method: 'POST' }),
  deliverSupplierOrder: (id: string) => fetchApi<any>(`/supplier/orders/${id}/deliver`, { method: 'POST' }),

  // Admin
  getAdminMetrics: () => fetchApi<any>('/admin/metrics'),
};

