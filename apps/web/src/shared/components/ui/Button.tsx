import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = variant === 'primary' ? 'btn-primary' : 'btn-ghost'
  return <button className={`${base} ${className}`} {...props} />
}
