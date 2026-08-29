import React, { Ref, useState } from 'react'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import { Filter as LabelFilterIcon } from 'mdi-material-ui'
import FilterContainer from '../util/FilterContainer'
import TelTextField from '../util/TelTextField'
import { useURLParam } from '../actions'
import { DEBOUNCE_DELAY } from '../config'

interface UserSearchFilterContainerProps {
  anchorRef?: Ref<HTMLElement>
}

export default function UserSearchFilterContainer(
  props: UserSearchFilterContainerProps,
): JSX.Element {
  const [searchParam, setSearchParam] = useURLParam('search', '' as string)
  
  const phoneMatch = searchParam.match(/(?:^|&)phone=([^&]*)/)
  const emailMatch = searchParam.match(/(?:^|&)email=([^&]*)/)
  const phoneValue = phoneMatch ? decodeURIComponent(phoneMatch[1]) : ''
  const emailValue = emailMatch ? decodeURIComponent(emailMatch[1]) : ''

  const [localPhone, setLocalPhone] = useState(phoneValue)
  const [localEmail, setLocalEmail] = useState(emailValue)
  const updateTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>()

  React.useEffect(() => {
    const urlHasFilters = phoneValue !== '' || emailValue !== ''
    
    if (urlHasFilters) {
      setLocalPhone((prev) => (prev !== phoneValue ? phoneValue : prev))
      setLocalEmail((prev) => (prev !== emailValue ? emailValue : prev))
    }
  }, [phoneValue, emailValue])

  React.useEffect(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    const parts: string[] = []
    if (localPhone.trim()) {
      parts.push(`phone=${encodeURIComponent(localPhone.trim())}`)
    }
    if (localEmail.trim()) {
      parts.push(`email=${encodeURIComponent(localEmail.trim())}`)
    }
    const newSearch = parts.join('&')

    const hasFilters = newSearch !== ''
    const urlHasFilters = searchParam.includes('phone=') || searchParam.includes('email=')

    if ((hasFilters || urlHasFilters) && newSearch !== searchParam) {
      updateTimeoutRef.current = setTimeout(() => {
        setSearchParam(newSearch)
      }, DEBOUNCE_DELAY)
    }

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [localPhone, localEmail, searchParam, setSearchParam])

  const handleReset = React.useCallback((): void => {
    setLocalPhone('')
    setLocalEmail('')
    setSearchParam('')
  }, [setSearchParam])

  return (
    <FilterContainer
      icon={<LabelFilterIcon />}
      title='Search Users'
      iconButtonProps={{
        'data-cy': 'users-filter-button',
        color: 'default',
        edge: 'end',
        size: 'small',
      }}
      onReset={handleReset}
      anchorRef={props.anchorRef}
    >
      <Grid data-cy='phone-number-container' item xs={12}>
        <TelTextField
          onChange={(e) => setLocalPhone(e.target.value || '')}
          value={localPhone}
          fullWidth
          name='user-phone-search'
          label='Search by Phone Number'
        />
      </Grid>
      <Grid data-cy='email-container' item xs={12}>
        <TextField
          onChange={(e) => setLocalEmail(e.target.value || '')}
          value={localEmail}
          fullWidth
          name='user-email-search'
          label='Search by Email'
          type='email'
          InputLabelProps={{
            shrink: true,
          }}
        />
      </Grid>
    </FilterContainer>
  )
}
