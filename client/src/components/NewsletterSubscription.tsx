import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import './NewsletterSubscription.css';

interface Market {
  code: string;
  name: string;
}

const NewsletterSubscription: React.FC = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMarkets, setLoadingMarkets] = useState<boolean>(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });
  const [emailError, setEmailError] = useState<string>('');

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    try {
      setLoadingMarkets(true);
      console.log('Fetching markets from API...');
      const response = await apiService.newsletterGetMarkets();
      console.log('Markets response:', response);
      if (response.success) {
        setMarkets(response.data);
        console.log('Markets loaded successfully:', response.data.length, 'countries');
        // デフォルトで日本を選択
        const japan = response.data.find((m: Market) => m.code === 'JP');
        if (japan) {
          setSelectedCountry('JP');
        }
      } else {
        console.error('API returned unsuccessful response:', response);
        setMessage({ type: 'error', text: '国リストの取得に失敗しました' });
      }
    } catch (error) {
      console.error('Failed to fetch markets - detailed error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        response: (error as any).response?.data,
        status: (error as any).response?.status
      });
      setMessage({ type: 'error', text: '国リストの取得に失敗しました' });
    } finally {
      setLoadingMarkets(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    if (value && !validateEmail(value)) {
      setEmailError('有効なメールアドレスを入力してください');
    } else {
      setEmailError('');
    }
  };

  const handleSubscribe = async () => {
    // バリデーション
    if (!email) {
      setEmailError('メールアドレスを入力してください');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('有効なメールアドレスを入力してください');
      return;
    }

    if (!selectedCountry) {
      setMessage({ type: 'error', text: '国を選択してください' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const response = await apiService.newsletterSubscribe(email, selectedCountry);

      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: 'メールボックスをチェックしてください' 
        });
        // フォームをリセット
        setEmail('');
        setEmailError('');
      } else {
        setMessage({ 
          type: 'error', 
          text: response.error || 'ニュースレターの購読に失敗しました' 
        });
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'ニュースレターの購読に失敗しました';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="newsletter-subscription">
      <div className="newsletter-card">
        <div className="newsletter-header">
          <div className="newsletter-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="newsletter-title">トップアーティストの最新情報を購読</h2>
        </div>

        <p className="newsletter-description">
          お好きな国のトップアーティストの最新情報を定期的にメールでお届けします
        </p>

        <div className="newsletter-form">
          <div className="form-group">
            <label htmlFor="country-select" className="form-label">
              国を選択
            </label>
            <select
              id="country-select"
              className="form-select"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              disabled={loadingMarkets}
            >
              {loadingMarkets ? (
                <option>読み込み中...</option>
              ) : (
                <>
                  {markets.map((market) => (
                    <option key={market.code} value={market.code}>
                      {market.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="email-input" className="form-label">
              メールアドレス
            </label>
            <input
              id="email-input"
              type="email"
              className={`form-input ${emailError ? 'error' : ''}`}
              placeholder="example@email.com"
              value={email}
              onChange={handleEmailChange}
              disabled={loading}
            />
            {emailError && (
              <span className="error-message">{emailError}</span>
            )}
          </div>

          <button
            className="subscribe-button"
            onClick={handleSubscribe}
            disabled={loading || loadingMarkets || !!emailError}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                <span>処理中...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>最新情報を得る</span>
              </>
            )}
          </button>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.type === 'success' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsletterSubscription;