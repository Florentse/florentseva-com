export default function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      flexGrow: 1,
      width: '100%'
    }}>
      <div style={{
        width: '10rem',
        height: '0.25rem',
        backgroundColor: 'var(--ft-border-color)',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '2px'
      }}>
        <div style={{
          position: 'absolute',
          height: '100%',
          backgroundColor: 'var(--ft-accent-color)',
          animation: 'fillLine 2s infinite ease-in-out'
        }} />
      </div>
    </div>
  );
}