export default function Brand({ light = false, className = '' }: { light?: boolean, className?: string }) {
  return <a href="#/login" className={`brand ${className}`} aria-label="Healthcare, início">
    <img src={light ? '/images/healthcare-logo-light.svg' : '/images/healthcare-logo.svg'} alt="Healthcare" width="240" height="56" />
  </a>
}
