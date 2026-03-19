import { SignUp } from '@clerk/nextjs'
import styles from './page.module.css'

export default function SignupPage() {
  return (
    <div className={styles.container}>
      <SignUp
        appearance={{
          variables: {
            colorPrimary: '#1a1a1a',
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            borderRadius: '6px',
          },
        }}
      />
    </div>
  )
}
