import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth.js';

/**
 * Loads the Razorpay external checkout script dynamically
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const existingScript = document.getElementById('razorpay-sdk');
    if (existingScript) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function RazorpayCheckout({ gigId, milestoneId, milestoneTitle, amount, onSuccess, onFailure }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        alert('Could not load Razorpay Payment Gateway. Check your network.');
        setLoading(false);
        return;
      }

      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Create order on server
      const res = await axios.post(
        'http://localhost:5000/api/payments/order',
        { gigId, milestoneId },
        { headers }
      );

      if (!res.data.success) {
        throw new Error(res.data.message || 'Order creation failed');
      }

      const { order, payment } = res.data;

      // 2. Open Razorpay Widget
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder', // Client-side public key
        amount: order.amount,
        currency: order.currency,
        name: 'SkillSphere Escrow',
        description: `Fund Milestone: "${milestoneTitle}"`,
        order_id: order.id,
        handler: async function (response) {
          try {
            setLoading(true);
            // 3. Verify payment signature on backend
            const verifyRes = await axios.post(
              'http://localhost:5000/api/payments/verify',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers }
            );

            if (verifyRes.data.success) {
              onSuccess(verifyRes.data.payment);
            } else {
              onFailure(verifyRes.data.message || 'Payment verification failed.');
            }
          } catch (verifyErr) {
            console.error('Verification request failed:', verifyErr);
            onFailure(verifyErr.response?.data?.message || 'Verification endpoint error.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#6366f1', // Indigo
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err) {
      console.error('Checkout initialization failed:', err);
      onFailure(err.response?.data?.message || err.message || 'Could not initiate checkout.');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Processing Escrow...
        </>
      ) : (
        <>
          💳 Fund Escrow (${amount})
        </>
      )}
    </button>
  );
}
