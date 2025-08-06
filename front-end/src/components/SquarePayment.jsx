// src/components/SquareDonationComponent.js

import React, { useState } from 'react';

const SquareDonationComponent = () => {
    // TODO: 这里放状态定义
    const [customAmount, setCustomAmount] = useState(0);
    

  
  // TODO: 这里放事件处理函数
    const handleDonate = () => {
        // 处理捐款逻辑
        console.log(`捐款金额: ${customAmount}`);
    };

  return (
    <div className="donation-container">
      {/* TODO: 这里放JSX结构 */}
      <h2>💰 Donations</h2>
      <p>支持我们的项目，您的捐款将帮助我们持续改进和维护。</p>
        <button className="donate-button" onClick={handleDonate}>捐款</button>
        <div className="custom-amount">
        <label>自定义金额：</label>
        <input
            type="number"
            placeholder="请输入金额"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
        />
        </div>

    </div>
    
  );
};

export default SquareDonationComponent;