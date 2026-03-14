import React, { forwardRef } from 'react';
import QRCode from 'react-qr-code';
import { Crown, Phone, Globe, Mail, Shield } from 'lucide-react';
import { API } from '@/context/AuthContext';

// Helper to get full photo URL
const getPhotoUrl = (photoUrl) => {
  if (!photoUrl) return null;
  // If it's already a full URL, return as is
  if (photoUrl.startsWith('http')) return photoUrl;
  // If it's a relative path, prepend the API base URL
  const baseUrl = API.replace('/api', '');
  return `${baseUrl}${photoUrl}`;
};

// Front side of the membership card
export const MembershipCardFront = forwardRef(({ member, user, qrSize = 80 }, ref) => {
  const memberName = member?.name || user?.name || 'Member';
  const memberId = member?.member_id || user?.member_id || 'BITZ-XXXX';
  const planName = member?.plan_name || 'Premium';
  const validityEnd = member?.membership_end 
    ? new Date(member.membership_end).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'N/A';
  const photoUrl = getPhotoUrl(member?.photo_url);
  const status = member?.status || 'pending';

  return (
    <div 
      ref={ref}
      className="membership-card-front"
      style={{
        width: '342px',
        height: '216px',
        background: 'linear-gradient(135deg, #1A1A1C 0%, #0F0F10 50%, #1A1A1C 100%)',
        borderRadius: '12px',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        border: '2px solid #D4AF37',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
      data-testid="membership-card-front"
    >
      {/* Gold decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-30px',
        right: '-30px',
        width: '120px',
        height: '120px',
        background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-40px',
        left: '-40px',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />
      
      {/* Header with logo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Crown style={{ width: '28px', height: '28px', color: '#D4AF37' }} />
          <span style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: 'white',
            fontFamily: 'Playfair Display, Georgia, serif',
            letterSpacing: '1px'
          }}>
            BITZ Club
          </span>
        </div>
        <div style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '10px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          background: status === 'active' ? 'rgba(34,197,94,0.2)' : status === 'pending' ? 'rgba(234,179,8,0.2)' : 'rgba(239,68,68,0.2)',
          color: status === 'active' ? '#22C55E' : status === 'pending' ? '#EAB308' : '#EF4444',
          border: `1px solid ${status === 'active' ? 'rgba(34,197,94,0.3)' : status === 'pending' ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'}`
        }}>
          {status}
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 'calc(100% - 60px)', position: 'relative', zIndex: 1 }}>
        {/* Left side - Photo and details */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end' }}>
          {/* Member Photo */}
          <div style={{
            width: '70px',
            height: '85px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '2px solid #D4AF37',
            background: '#2A2A2C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {photoUrl ? (
              <img 
                src={photoUrl} 
                alt={memberName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                crossOrigin="anonymous"
              />
            ) : (
              <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #3A3A3C 0%, #2A2A2C 100%)'
              }}>
                <span style={{ fontSize: '28px', color: '#D4AF37', fontWeight: 'bold' }}>
                  {memberName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          {/* Member details */}
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Member</p>
            <p style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: 'white', 
              marginBottom: '4px',
              maxWidth: '140px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>{memberName}</p>
            <p style={{ 
              fontSize: '13px', 
              color: '#D4AF37', 
              fontFamily: 'monospace',
              fontWeight: '600',
              marginBottom: '8px'
            }}>{memberId}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '9px', color: '#6B7280', textTransform: 'uppercase' }}>Plan</p>
                <p style={{ fontSize: '11px', color: '#E5E7EB', fontWeight: '500' }}>{planName}</p>
              </div>
              <div>
                <p style={{ fontSize: '9px', color: '#6B7280', textTransform: 'uppercase' }}>Valid Till</p>
                <p style={{ fontSize: '11px', color: '#E5E7EB', fontWeight: '500' }}>{validityEnd}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - QR Code */}
        <div style={{ 
          background: 'white', 
          padding: '8px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          flexShrink: 0
        }}>
          <QRCode
            value={memberId}
            size={qrSize}
            level="M"
            style={{ display: 'block' }}
          />
        </div>
      </div>
    </div>
  );
});

// Back side of the membership card
export const MembershipCardBack = forwardRef(({ member }, ref) => {
  return (
    <div 
      ref={ref}
      className="membership-card-back"
      style={{
        width: '342px',
        height: '216px',
        background: 'linear-gradient(135deg, #1A1A1C 0%, #0F0F10 50%, #1A1A1C 100%)',
        borderRadius: '12px',
        padding: '16px 20px',
        position: 'relative',
        overflow: 'hidden',
        border: '2px solid #D4AF37',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
      data-testid="membership-card-back"
    >
      {/* Decorative pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '100px',
        background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.05))',
        pointerEvents: 'none'
      }} />

      {/* Terms & Conditions */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Shield style={{ width: '12px', height: '12px', color: '#D4AF37' }} />
          <h3 style={{ fontSize: '11px', color: '#D4AF37', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Terms & Conditions</h3>
        </div>
        <ul style={{ fontSize: '8px', color: '#9CA3AF', lineHeight: '1.5', margin: 0, paddingLeft: '12px' }}>
          <li style={{ marginBottom: '2px' }}>This card is non-transferable and valid only for the named member.</li>
          <li style={{ marginBottom: '2px' }}>Present this card at partner venues to avail exclusive discounts.</li>
          <li style={{ marginBottom: '2px' }}>Card benefits are subject to partner terms and availability.</li>
          <li>BITZ Club reserves the right to modify benefits without prior notice.</li>
        </ul>
      </div>

      {/* Partner Usage */}
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '10px', color: '#D4AF37', fontWeight: '600', marginBottom: '4px' }}>How to Use</h3>
        <p style={{ fontSize: '8px', color: '#9CA3AF', lineHeight: '1.4', margin: 0 }}>
          Show this card or scan QR code at partner venues. Benefits apply to cardholder only. 
          Verify membership status at bitzclub.com/verify
        </p>
      </div>

      {/* Contact Information */}
      <div style={{ 
        borderTop: '1px solid rgba(212,175,55,0.2)', 
        paddingTop: '10px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Phone style={{ width: '10px', height: '10px', color: '#D4AF37' }} />
          <span style={{ fontSize: '9px', color: '#E5E7EB' }}>+91 98765 43210</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Mail style={{ width: '10px', height: '10px', color: '#D4AF37' }} />
          <span style={{ fontSize: '9px', color: '#E5E7EB' }}>hello@bitzclub.com</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', gridColumn: 'span 2' }}>
          <Globe style={{ width: '10px', height: '10px', color: '#D4AF37' }} />
          <span style={{ fontSize: '9px', color: '#E5E7EB' }}>www.bitzclub.com</span>
        </div>
      </div>

      {/* Emergency Contact */}
      <div style={{ 
        position: 'absolute',
        bottom: '12px',
        right: '16px',
        textAlign: 'right'
      }}>
        <p style={{ fontSize: '8px', color: '#6B7280', marginBottom: '2px' }}>24/7 Support</p>
        <p style={{ fontSize: '10px', color: '#D4AF37', fontWeight: '600' }}>1800-XXX-BITZ</p>
      </div>
    </div>
  );
});

MembershipCardFront.displayName = 'MembershipCardFront';
MembershipCardBack.displayName = 'MembershipCardBack';

export default MembershipCardFront;
