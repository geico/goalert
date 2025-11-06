import React, { Ref, useEffect, useState } from 'react'
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
  const [phoneValue, setPhoneValue] = useState('')
  const [emailValue, setEmailValue] = useState('')

  // Parse phone and email from search param on mount or when it changes externally
  useEffect(() => {
    // Match phone=value (at start or after &) and email=value (at start or after &)
    const phoneMatch = searchParam.match(/(?:^|&)phone=([^&]*)/)
    const emailMatch = searchParam.match(/(?:^|&)email=([^&]*)/)

    setPhoneValue(phoneMatch ? decodeURIComponent(phoneMatch[1]) : '')
    setEmailValue(emailMatch ? decodeURIComponent(emailMatch[1]) : '')
  }, [searchParam])

  // When phone or email changes, update the search param
  useEffect(() => {
    const parts: string[] = []
    if (phoneValue.trim()) {
      parts.push(`phone=${encodeURIComponent(phoneValue.trim())}`)
    }
    if (emailValue.trim()) {
      parts.push(`email=${encodeURIComponent(emailValue.trim())}`)
    }

    const newSearch = parts.join('&')

    const t = setTimeout(() => {
      setSearchParam(newSearch)
    }, DEBOUNCE_DELAY)

    return () => clearTimeout(t)
  }, [phoneValue, emailValue, setSearchParam])

  const handleReset = (): void => {
    setPhoneValue('')
    setEmailValue('')
    setSearchParam('')
  }

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
          onChange={(e) => setPhoneValue(e.target.value || '')}
          value={phoneValue}
          fullWidth
          name='user-phone-search'
          label='Search by Phone Number'
        />
      </Grid>
      <Grid data-cy='email-container' item xs={12}>
        <TextField
          onChange={(e) => setEmailValue(e.target.value || '')}
          value={emailValue}
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
