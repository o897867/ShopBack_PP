import React, { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';

/**
 * 这是一个封装了Square Web Payments SDK的React组件。
 * 它负责渲染信用卡输入表单，并将用户的支付信息安全地转换为一次性Token。
 * @param {object} props - 组件属性
 * @param {string} props.applicationId - 你的Square应用ID (公开)
 * @param {string} props.locationId - 你的Square收款地点ID (公开)
 * @param {function(string): void} props.onTokenReceived - 成功获取Token后的回调函数
 */
const SquarePaymentForm = forwardRef(({ applicationId, locationId, onTokenReceived, onReady }, ref) => {
  
  // 使用useRef来存储Square的card实例，避免在组件重新渲染时丢失
  const cardRef = useRef(null);

  // useEffect将在组件首次挂载到DOM后运行
  useEffect(() => {
    const initializeCard = async () => {
      // 确保Square SDK已经通过index.html加载
      if (!window.Square) {
        console.error('Square SDK not loaded');
        return;
      }

      // 使用从props传入的ID初始化支付对象
      const payments = window.Square.payments(applicationId, locationId, {
        env: 'sandbox' // 强制指定环境为沙箱
      }); 
      
      try {
        // 创建并配置卡片输入实例
        const card = await payments.card({
          style: {
            '.input-container': {
              borderColor: '#E0E0E0',
              borderRadius: '8px',
              borderWidth: '2px',
            },
            '.input-container.is-focus': {
              borderColor: '#007bff',
            },
            '.input-container.is-error': {
              borderColor: '#ff1744',
            },
            '.message-text': {
              color: '#ff1744',
            },
            'input': {
              fontSize: '16px',
            }
          }
        });

        // 将卡片表单安全地附加到我们指定的div上
        await card.attach('#card-container'); 
        
        // 保存card实例以备后用
        cardRef.current = card; 
        console.log('Square card form initialized and attached.');
        
        // 通知父组件已准备就绪
        if (onReady) {
          onReady();
        }
      } catch (e) {
        console.error('Initializing Card failed', e);
      }
    };

    initializeCard();
  }, [applicationId, locationId, onReady]); // 依赖项数组确保只在ID变化时才重新初始化

  // useImperativeHandle允许我们自定义暴露给父组件的ref实例
  // 这样父组件就可以调用我们在这里定义的函数
  useImperativeHandle(ref, () => ({
    /**
     * 处理支付请求，安全地将卡信息发送给Square以换取一个一次性的支付Token。
     * @throws {Error} 如果支付表单未初始化或Token化失败
     */
    async handlePaymentRequest() {
      if (!cardRef.current) {
        console.error('Card object not ready.');
        throw new Error('Payment form is not yet initialized.');
      }

      try {
        // 调用Square SDK的tokenize方法，这是最关键的一步
        const result = await cardRef.current.tokenize();
        
        if (result.status === 'OK') {
          console.log('Tokenization successful, token:', result.token);
          // 成功获取Token，通过回调函数将其传递给父组件(DonationPage)
          onTokenReceived(result.token);
        } else {
          // 如果失败，构造详细的错误信息
          let errorMessage = `Tokenization failed with status: ${result.status}`;
          if (result.errors) {
            errorMessage += ` and errors: ${JSON.stringify(result.errors)}`;
          }
          throw new Error(errorMessage);
        }
      } catch (e) {
        console.error('Error during tokenization:', e);
        throw e; // 再次抛出异常，以便调用方可以捕获并处理
      }
    }
  }));

  // 这是组件的UI部分，一个简单的div作为Square卡片表单的容器。
  // 实际的输入框将由Square SDK安全地渲染在这个div内部。
  return (
    <div id="card-container" style={{ minHeight: '50px' }}></div>
  );
});

export default SquarePaymentForm;
