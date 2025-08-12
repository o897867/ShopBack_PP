import React, { useState, useRef, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { t } from '../translations/index';
import SquarePaymentForm from '../components/SquarePaymentForm.jsx'; // 1. 导入新组件

// !! 重要提示: 在生产环境中，这些值应该来自环境变量 !!
const SQUARE_APPLICATION_ID = import.meta.env.VITE_SQUARE_APPLICATION_ID;
const SQUARE_LOCATION_ID = import.meta.env.VITE_SQUARE_LOCATION_ID;

const DonationPage = () => {
  // 在这里添加测试代码
  console.log("--- Checking Environment Variables ---");
  console.log("Attempting to load App ID:", import.meta.env.VITE_SQUARE_APPLICATION_ID);
  console.log("Attempting to load Location ID:", import.meta.env.VITE_SQUARE_LOCATION_ID);
  console.log("------------------------------------");
  const { language } = useLanguage();
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCardFormReady, setIsCardFormReady] = useState(false); // 新增状态
  
  // 2. 创建一个ref来与SquarePaymentForm子组件通信
  const squareFormRef = useRef();

  const translate = (key) => t(key, language);

  const presetAmounts = [5, 10, 25, 50, 100];

  // 5. 实现支付Token接收函数
  const handleTokenReceived = async (token) => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    console.log('Token received in DonationPage:', token);
    console.log(`Now, sending token and amount ($${amount}) to our backend...`);
    
    // 解除注释，启用真实的后端API调用
    try {
      const response = await fetch('/api/donations/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, amount }) // 只需发送token和amount
      });
      
      const data = await response.json();
      
      if (response.ok) { // 检查HTTP状态码是否为 2xx
        alert('Thank you for your donation!');
      } else {
        throw new Error(data.detail || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 使用 useCallback 稳定化这个函数
  const handleCardFormReady = useCallback(() => {
    console.log("DonationPage: Card form is now ready.");
    setIsCardFormReady(true);
  }, []);
  
  // 4. 修改捐赠处理函数以触发子组件
  const handleDonation = async () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (!amount || amount <= 0) {
      alert(translate('donation.invalidAmount'));
      return;
    }

    if (!squareFormRef.current) {
      alert('Payment form is not ready.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // 调用子组件暴露的handlePaymentRequest方法
      await squareFormRef.current.handlePaymentRequest();
    } catch (error) {
      console.error('Failed to get payment token:', error);
      alert(`Payment Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const currentAmount = customAmount || selectedAmount;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      {/* 页面标题 */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2rem', color: '#333' }}>
          {translate('donation.title')}
        </h1>
        <p style={{ margin: 0, fontSize: '1.1rem', color: '#666' }}>
          {translate('donation.subtitle')}
        </p>
      </div>

      {/* 金额选择 */}
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '1.5rem' }}>
          1. {translate('donation.chooseAmount')}
        </h2>

        {/* 预设金额按钮 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
          gap: '15px',
          marginBottom: '25px'
        }}>
          {presetAmounts.map(amount => (
            <button
              key={amount}
              onClick={() => {
                setSelectedAmount(amount);
                setCustomAmount('');
              }}
              style={{
                background: selectedAmount === amount && !customAmount ? '#007bff' : '#f8f9fa',
                color: selectedAmount === amount && !customAmount ? 'white' : '#333',
                border: '2px solid',
                borderColor: selectedAmount === amount && !customAmount ? '#007bff' : '#e9ecef',
                padding: '15px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              ${amount}
            </button>
          ))}
        </div>

        {/* 自定义金额 */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            {translate('donation.customAmount')}
          </label>
          <input
            type="number"
            placeholder={translate('donation.amountPlaceholder')}
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedAmount(null);
            }}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>
      
      {/* 支付区域 */}
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '1.5rem' }}>
          2. {translate('donation.payWithCard')}
        </h2>

        {/* 3. 渲染SquarePaymentForm并传递ref和props */}
        <div style={{ marginBottom: '25px' }}>
          <SquarePaymentForm
            ref={squareFormRef}
            applicationId={SQUARE_APPLICATION_ID}
            locationId={SQUARE_LOCATION_ID}
            onTokenReceived={handleTokenReceived}
            onReady={handleCardFormReady} // 传递新的回调
          />
        </div>

        <button
          onClick={handleDonation}
          disabled={isProcessing || !currentAmount || currentAmount <= 0 || !isCardFormReady} // 关联新状态
          style={{
            background: isProcessing || !currentAmount || currentAmount <= 0 || !isCardFormReady ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            width: '100%',
            padding: '16px',
            borderRadius: '8px',
            cursor: isCardFormReady ? 'pointer' : 'wait', // 准备好前显示等待光标
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            opacity: isProcessing || !currentAmount || currentAmount <= 0 || !isCardFormReady ? 0.6 : 1
          }}
        >
          {isProcessing 
            ? translate('donation.processing') 
            : !isCardFormReady 
            ? 'Initializing Payment Form...' 
            : `Donate $${currentAmount}`}
        </button>
      </div>
    </div>
  );
};

export default DonationPage; 