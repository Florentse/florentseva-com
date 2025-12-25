export default function CardLoader() {
  return (
    <div className="service-card-skeleton" style={{
      padding: 'var(--ft--spacing-size-24)',
      border: '1px solid var(--ft-border-color)',
      borderRadius: '8px',
      animation: 'pulse 1.5s infinite ease-in-out'
    }}>
      {/* Заголовок */}
      <div style={{ 
        width: '60%', 
        height: '1.5rem', 
        backgroundColor: 'var(--ft-skeleton-color)', 
        marginBottom: '1rem' 
      }} />
      {/* Описание (2 строки) */}
      <div style={{ 
        width: '100%', 
        height: '1rem', 
        backgroundColor: 'var(--ft-skeleton-color)', 
        marginBottom: '0.5rem' 
      }} />
      <div style={{ 
        width: '80%', 
        height: '1rem', 
        backgroundColor: 'var(--ft-skeleton-color)', 
        marginBottom: '1.5rem' 
      }} />
      {/* Ссылка */}
      <div style={{ 
        width: '30%', 
        height: '1rem', 
        backgroundColor: 'var(--ft-skeleton-color)' 
      }} />
    </div>
  );
}