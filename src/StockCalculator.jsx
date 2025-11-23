import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Plus, Trash2, DollarSign, Rocket, Sparkles, AlertCircle } from 'lucide-react';
import './App.css';

export default function StockCalculator() {
  const [stocks, setStocks] = useState([]);
  const [company, setCompany] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [currentPrices, setCurrentPrices] = useState({});
  const [selectedForSale, setSelectedForSale] = useState({});
  const [showStrategy, setShowStrategy] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const companyRef = React.useRef(null);
  const buyPriceRef = React.useRef(null);
  const quantityRef = React.useRef(null);
  const currentPriceRef = React.useRef(null);

  const tutorialSteps = [
    {
      title: "Step 1: Enter Company Ticker",
      description: "Start by typing the stock ticker symbol (e.g., AAPL, RELIANCE, TCS) in the Ticker field."
    },
    {
      title: "Step 2: Set Buy Date",
      description: "Select the date when you purchased this stock."
    },
    {
      title: "Step 3: Enter Buy Price",
      description: "Input the price at which you bought each share."
    },
    {
      title: "Step 4: Add Current Price (Optional)",
      description: "Enter the current market price to see real-time profit/loss calculation."
    },
    {
      title: "Step 5: Set Quantity",
      description: "Enter how many shares you purchased."
    },
    {
      title: "Step 6: Add to Portfolio",
      description: "Click 'Add lot' to add this stock to your portfolio. You can add multiple entries!"
    },
    {
      title: "Step 7: View Your Holdings",
      description: "See all your stocks in the Holdings section. Select quantities to sell and get AI recommendations!"
    }
  ];

  const addStock = () => {
    if (company && buyPrice && quantity) {
      const newStock = {
        id: Date.now(),
        company: company.toUpperCase(),
        buyPrice: parseFloat(buyPrice),
        quantity: parseInt(quantity),
        date: new Date().toLocaleDateString('en-IN')
      };
      setStocks([...stocks, newStock]);
      
      if (currentPrice) {
        setCurrentPrices({...currentPrices, [company.toUpperCase()]: parseFloat(currentPrice)});
      }
      
      setCompany('');
      setBuyPrice('');
      setQuantity('');
      setCurrentPrice('');
    }
  };

  const handleKeyPress = (e, nextFieldRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextFieldRef && nextFieldRef.current) {
        nextFieldRef.current.focus();
      } else {
        addStock();
      }
    }
  };

  const deleteStock = (id) => {
    setStocks(stocks.filter(stock => stock.id !== id));
  };

  const updateCurrentPrice = (company, price) => {
    setCurrentPrices({...currentPrices, [company]: parseFloat(price)});
  };

  const updateSellQuantity = (stockId, sellQty) => {
    setSelectedForSale({...selectedForSale, [stockId]: parseInt(sellQty) || 0});
  };

  const calculateMetrics = () => {
    const companies = [...new Set(stocks.map(s => s.company))];
    
    return companies.map(comp => {
      const companyStocks = stocks.filter(s => s.company === comp);
      const totalQuantity = companyStocks.reduce((sum, s) => sum + s.quantity, 0);
      const totalInvestment = companyStocks.reduce((sum, s) => sum + (s.buyPrice * s.quantity), 0);
      const avgBuyPrice = totalInvestment / totalQuantity;
      const currentPrice = currentPrices[comp] || 0;
      const currentValue = currentPrice * totalQuantity;
      const profitLoss = currentValue - totalInvestment;
      const profitLossPercent = ((profitLoss / totalInvestment) * 100) || 0;

      return {
        company: comp,
        totalQuantity,
        avgBuyPrice,
        totalInvestment,
        currentPrice,
        currentValue,
        profitLoss,
        profitLossPercent,
        stocks: companyStocks
      };
    });
  };

  const calculateSellProfitLoss = () => {
    let totalSellInvestment = 0;
    let totalSellValue = 0;

    stocks.forEach(stock => {
      const sellQty = selectedForSale[stock.id] || 0;
      if (sellQty > 0 && sellQty <= stock.quantity) {
        const investment = stock.buyPrice * sellQty;
        const currentPrice = currentPrices[stock.company] || 0;
        const value = currentPrice * sellQty;
        
        totalSellInvestment += investment;
        totalSellValue += value;
      }
    });

    const profitLoss = totalSellValue - totalSellInvestment;
    const profitLossPercent = totalSellInvestment > 0 ? ((profitLoss / totalSellInvestment) * 100) : 0;

    return { totalSellInvestment, totalSellValue, profitLoss, profitLossPercent };
  };

  const generateAISellSuggestion = () => {
    const stockAnalysis = stocks.map(stock => {
      const currentPrice = currentPrices[stock.company] || 0;
      const profitPerUnit = currentPrice - stock.buyPrice;
      const profitPercent = stock.buyPrice > 0 ? ((profitPerUnit / stock.buyPrice) * 100) : 0;
      
      return {
        ...stock,
        currentPrice,
        profitPerUnit,
        profitPercent,
        totalProfit: profitPerUnit * stock.quantity
      };
    }).filter(s => s.currentPrice > 0);

    const profitableStocks = stockAnalysis.filter(s => s.profitPerUnit > 0).sort((a, b) => b.profitPercent - a.profitPercent);
    const breakEvenStocks = stockAnalysis.filter(s => Math.abs(s.profitPerUnit) < 1);
    const lossStocks = stockAnalysis.filter(s => s.profitPerUnit < -1).sort((a, b) => a.profitPercent - b.profitPercent);

    return { profitableStocks, breakEvenStocks, lossStocks, allStocks: stockAnalysis };
  };

  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
      setTutorialStep(0);
    }
  };

  const prevTutorialStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  };

  const metrics = calculateMetrics();
  const sellMetrics = calculateSellProfitLoss();
  const aiSuggestion = generateAISellSuggestion();
  const totalInvestment = metrics.reduce((sum, m) => sum + m.totalInvestment, 0);
  const totalCurrentValue = metrics.reduce((sum, m) => sum + m.currentValue, 0);
  const totalProfitLoss = totalCurrentValue - totalInvestment;
  const totalProfitLossPercent = totalInvestment > 0 ? ((totalProfitLoss / totalInvestment) * 100) : 0;

  return (
    <div className="stock-calculator-container">
      {/* Animated Background Blobs */}
      <div className="background-blob blob-1"></div>
      <div className="background-blob blob-2"></div>
      <div className="background-blob blob-3"></div>

      {/* Header */}
      <div className="header-section animate-fadeIn">
        <div className="header-left">
          <div className="rocket-container">
            <Rocket className="rocket-icon" />
            <div className="rocket-glow"></div>
          </div>
          <div>
            <h1 className="header-title">Stock Calculator — Faadu Portfolio Tool</h1>
            <p className="header-subtitle">AI-Powered Smart Trading Analysis</p>
          </div>
        </div>
        <button onClick={() => setShowTutorial(true)} className="tutorial-button">
          <AlertCircle style={{width: '20px', height: '20px'}} />
          Tutorial
        </button>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="modal-overlay animate-fadeIn">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                <Sparkles className="ai-icon" />
                Getting Started Guide
              </h2>
              <button onClick={() => setShowTutorial(false)} className="modal-close">
                <svg style={{width: '24px', height: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="tutorial-step">
              <div className="step-header">
                <div className="step-number">{tutorialStep + 1}</div>
                <h3 className="step-title">{tutorialSteps[tutorialStep].title}</h3>
              </div>
              <p className="step-description">{tutorialSteps[tutorialStep].description}</p>
            </div>

            <div className="progress-section">
              <div className="progress-header">
                <span>Progress</span>
                <span>{tutorialStep + 1} / {tutorialSteps.length}</span>
              </div>
              <div className="progress-track">
                <div className="progress-bar-fill" style={{width: `${((tutorialStep + 1) / tutorialSteps.length) * 100}%`}}></div>
              </div>
            </div>

            <div className="modal-buttons">
              {tutorialStep > 0 && (
                <button onClick={prevTutorialStep} className="btn-prev">Previous</button>
              )}
              <button onClick={nextTutorialStep} className="btn-next">
                {tutorialStep === tutorialSteps.length - 1 ? 'Get Started!' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Summary Cards */}
      {stocks.length > 0 && (
        <div className="summary-cards animate-fadeIn">
          <div className="summary-card">
            <div className="card-label">
              <div className="status-dot dot-blue"></div>
              Invested
            </div>
            <div className="card-value">₹{totalInvestment.toLocaleString('en-IN')}</div>
            <div className="progress-bar">
              <div className="progress-fill progress-blue" style={{width: '70%'}}></div>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-label">
              <div className="status-dot dot-purple"></div>
              Market Value
            </div>
            <div className="card-value">₹{totalCurrentValue.toLocaleString('en-IN')}</div>
            <div className="progress-bar">
              <div className="progress-fill progress-purple" style={{width: '85%'}}></div>
            </div>
          </div>

          <div className={`summary-card ${totalProfitLoss >= 0 ? 'profit-card' : 'loss-card'}`}>
            <div className="card-label">
              <div className={`status-dot ${totalProfitLoss >= 0 ? 'dot-green' : 'dot-red'}`}></div>
              Unrealized P/L
            </div>
            <div className="card-value">
              {totalProfitLoss >= 0 ? <TrendingUp style={{width: '32px', height: '32px'}} /> : <TrendingDown style={{width: '32px', height: '32px'}} />}
              <div>
                {totalProfitLoss >= 0 ? '+' : ''}₹{Math.abs(totalProfitLoss).toFixed(0)}
                <span style={{fontSize: '1.25rem', marginLeft: '0.5rem'}}>
                  ({totalProfitLossPercent >= 0 ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
            <div className="progress-bar">
              <div className={`progress-fill ${totalProfitLoss >= 0 ? 'progress-green' : 'progress-red'}`} 
                   style={{width: Math.min(Math.abs(totalProfitLossPercent), 100) + '%'}}></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="main-grid">
        {/* Left Column - Add Buy Form */}
        <div className="glass-card">
          <h2 className="card-header">
            <Plus className="card-icon icon-blue" />
            Add buy (lot)
          </h2>

          <div className="form-group">
            <label className="form-label">Ticker</label>
            <input
              ref={companyRef}
              type="text"
              placeholder="AAPL"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, buyPriceRef)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Buy date</label>
            <input type="date" className="form-input" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Buy price</label>
              <input
                ref={buyPriceRef}
                type="number"
                placeholder="e.g. 150.5"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, quantityRef)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Current price</label>
              <input
                ref={currentPriceRef}
                type="number"
                placeholder="Optional"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, quantityRef)}
                className="form-input form-input-yellow"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input
              ref={quantityRef}
              type="number"
              placeholder="e.g. 10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, null)}
              className="form-input"
            />
          </div>

          <div className="button-group">
            <button onClick={addStock} className="btn btn-primary">
              <Plus style={{width: '20px', height: '20px'}} />
              Add lot
            </button>
            <button className="btn btn-secondary">Clear</button>
          </div>

          {/* Current Prices Section */}
          {stocks.length > 0 && (
            <div className="current-prices">
              <h3 className="card-header" style={{fontSize: '1.125rem'}}>Current prices (edit)</h3>
              {[...new Set(stocks.map(s => s.company))].map(comp => (
                <div key={comp} className="price-item">
                  <span className="price-company">{comp}</span>
                  <div className="price-input-group">
                    <input
                      type="number"
                      placeholder="Current price"
                      value={currentPrices[comp] || ''}
                      onChange={(e) => updateCurrentPrice(comp, e.target.value)}
                      className="price-input"
                    />
                    <span className="price-display">₹{currentPrices[comp] || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Holdings & Sell Preview */}
        <div className="glass-card">
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem'}}>
            <h2 className="card-header" style={{margin: 0}}>
              <DollarSign className="card-icon icon-purple" />
              Holdings & Sell preview
            </h2>
            <span style={{fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(51, 65, 85, 0.5)', padding: '0.25rem 0.75rem', borderRadius: '9999px'}}>
              Tip: preview sells to test scenarios
            </span>
          </div>

          {stocks.length === 0 ? (
            <div className="empty-state">
              <TrendingUp className="empty-icon" />
              <p className="empty-title">Your portfolio is empty!</p>
              <p className="empty-subtitle">Add your first stock to get started!</p>
            </div>
          ) : (
            <div>
              {stocks.map(stock => {
                const sellQty = selectedForSale[stock.id] || 0;
                const currentPrice = currentPrices[stock.company] || 0;
                const plPerUnit = currentPrice - stock.buyPrice;

                return (
                  <div key={stock.id} className="stock-card">
                    <div className="stock-card-header">
                      <div>
                        <h3 className="stock-company">{stock.company}</h3>
                        <p className="stock-date">Bought ₹{stock.buyPrice} on {stock.date}</p>
                      </div>
                      <div className="stock-stats">
                        <div className="stat-item">
                          <div className="stat-label">Qty:</div>
                          <div className="stat-value">{stock.quantity}</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">Cur:</div>
                          <div className="stat-value">₹{currentPrice || '-'}</div>
                        </div>
                        {currentPrice > 0 && (
                          <div className="stat-badge">
                            <div className="stat-label">Potential P/L:</div>
                            <div className={`stat-value ${plPerUnit >= 0 ? 'profit' : 'loss'}`}>
                              ₹{plPerUnit >= 0 ? '+' : ''}{(plPerUnit * stock.quantity).toFixed(0)}
                            </div>
                          </div>
                        )}
                        <input
                          type="number"
                          min="0"
                          max={stock.quantity}
                          value={sellQty}
                          onChange={(e) => updateSellQuantity(stock.id, e.target.value)}
                          placeholder="0"
                          className="sell-input"
                        />
                        <button 
                          onClick={() => deleteStock(stock.id)}
                          className="btn btn-sell"
                          style={{background: 'linear-gradient(to right, #dc2626, #b91c1c)', display: 'flex', alignItems: 'center', gap: '0.5rem'}}
                        >
                          <Trash2 style={{width: '16px', height: '16px'}} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Sell Preview Summary */}
              {sellMetrics.totalSellInvestment > 0 && (
                <div className="sell-summary">
                  <h3 className="sell-summary-title">Sell preview summary</h3>
                  <div className="sell-stats">
                    <div className="sell-stat">
                      <div className="sell-stat-label">Sell qty:</div>
                      <div className="sell-stat-value">
                        {Object.values(selectedForSale).reduce((sum, qty) => sum + qty, 0)}
                      </div>
                    </div>
                    <div className="sell-stat">
                      <div className="sell-stat-label">Proceeds:</div>
                      <div className="sell-stat-value">₹{sellMetrics.totalSellValue.toFixed(0)}</div>
                    </div>
                    <div className="sell-stat">
                      <div className="sell-stat-label">Profit (est):</div>
                      <div className={`sell-stat-value ${sellMetrics.profitLoss >= 0 ? 'text-green' : 'text-red'}`}>
                        ₹{sellMetrics.profitLoss >= 0 ? '+' : ''}{sellMetrics.profitLoss.toFixed(0)}
                      </div>
                    </div>
                  </div>
                  <div className="button-group">
                    <button className="btn btn-primary" style={{flex: 1}}>Commit sell (apply)</button>
                    <button className="btn btn-secondary">Clear preview</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Smart Sell Suggestion */}
      {aiSuggestion.allStocks.length > 0 && (
        <div className="ai-section">
          <div className="ai-header" onClick={() => setShowStrategy(!showStrategy)}>
            <div className="ai-title">
              <Sparkles className="ai-icon" />
              Smart sell suggestion
            </div>
            <span className="ai-toggle">{showStrategy ? '▼' : '▶'}</span>
          </div>
          <p className="ai-subtitle">
            For each ticker we recommend selling lots that give the highest profit-per-share first (so you pocket the best gains).
            You can preview and commit these suggestions.
          </p>

          {showStrategy && (
            <div className="ai-content">
              {aiSuggestion.profitableStocks.length > 0 && (
                <div className="suggestion-group">
                  <h3 className="suggestion-title profit">
                    <TrendingUp style={{width: '20px', height: '20px'}} />
                    Profitable Stocks - SELL NOW
                  </h3>
                  {aiSuggestion.profitableStocks.map((stock) => (
                    <div key={stock.id} className="suggestion-item">
                      <div className="suggestion-left">
                        <span className="suggestion-company">{stock.company}</span>
                        <span className="suggestion-details">— total qty {stock.quantity}</span>
                      </div>
                      <div className="suggestion-right">
                        <div className="suggestion-profit">Top lot profit/share: ₹+{stock.profitPerUnit.toFixed(2)}</div>
                        <div className="suggestion-total">Total potential: ₹{stock.totalProfit.toFixed(0)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {aiSuggestion.lossStocks.length > 0 && (
                <div className="suggestion-group">
                  <h3 className="suggestion-title loss">
                    <TrendingDown style={{width: '20px', height: '20px'}} />
                    Loss-making Stocks - Consider Holding
                  </h3>
                  {aiSuggestion.lossStocks.map(stock => (
                    <div key={stock.id} className="suggestion-item loss-item">
                      <div className="suggestion-left">
                        <span className="suggestion-company">{stock.company}</span>
                        <span className="suggestion-details">— total qty {stock.quantity}</span>
                      </div>
                      <div className="suggestion-right">
                        <div className="suggestion-loss">Loss/share: ₹{stock.profitPerUnit.toFixed(2)}</div>
                        <div className="suggestion-total">Total loss: ₹{Math.abs(stock.totalProfit).toFixed(0)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}