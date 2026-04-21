import styles from './SectionHeader.module.css'

interface Props {
  label: string
}

export function SectionHeader({ label }: Props) {
  return <div className={styles.header}>{label}</div>
}
