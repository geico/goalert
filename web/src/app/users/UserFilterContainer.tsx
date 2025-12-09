import React, { Ref, useEffect, useState } from 'react'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { Filter as LabelFilterIcon } from 'mdi-material-ui'

import { LabelKeySelect } from '../selection/LabelKeySelect'
import { LabelValueSelect } from '../selection/LabelValueSelect'
import FilterContainer from '../util/FilterContainer'
import TelTextField from '../util/TelTextField'
import { DEBOUNCE_DELAY } from '../config'

interface Value {
  labelKey: string
  labelValue: string
  phoneNumber: string
}

interface UserFilterContainerProps {
  value: Value
  onChange: (val: Value) => void
  onReset: () => void

  // optionally anchors the popover to a specified element's ref
  anchorRef?: Ref<HTMLElement>
}

export default function UserFilterContainer(
  props: UserFilterContainerProps,
): JSX.Element {
  const { labelKey, labelValue, phoneNumber } = props.value
  const [phoneSearch, setPhoneSearch] = useState(phoneNumber)
  
  // Handle phone number debouncing
  useEffect(() => {
    const t = setTimeout(() => {
      props.onChange({ ...props.value, phoneNumber: phoneSearch })
    }, DEBOUNCE_DELAY)

    return () => clearTimeout(t)
  }, [phoneSearch])

  // Update internal phone state when prop changes
  useEffect(() => {
    setPhoneSearch(phoneNumber)
  }, [phoneNumber])

  return (
    <FilterContainer
      icon={<LabelFilterIcon />}
      title='Search Users by Filters'
      iconButtonProps={{
        'data-cy': 'users-filter-button',
        color: 'default',
        edge: 'end',
        size: 'small',
      }}
      onReset={props.onReset}
      anchorRef={props.anchorRef}
    >
      <Grid item xs={12}>
        <Typography color='textSecondary'>
          <i>Search by Phone Number</i>
        </Typography>
      </Grid>
      <Grid data-cy='phone-number-container' item xs={12}>
        <TelTextField
          onChange={(e) => setPhoneSearch(e.target.value)}
          value={phoneSearch}
          fullWidth
          name='user-phone-search'
          label='Search by Phone Number'
        />
      </Grid>
      
      <Grid item xs={12}>
        <Typography color='textSecondary'>
          <i>Search by Label</i>
        </Typography>
      </Grid>
      <Grid data-cy='label-key-container' item xs={12}>
        <LabelKeySelect
          name='label-key'
          label='Select Label Key'
          value={labelKey}
          targetType='user'
          onChange={(labelKey: string) =>
            props.onChange({ ...props.value, labelKey })
          }
        />
      </Grid>
      <Grid data-cy='label-value-container' item xs={12}>
        <LabelValueSelect
          name='label-value'
          label='Select Label Value'
          labelKey={labelKey}
          targetType='user'
          value={labelValue}
          onChange={(v: string) =>
            props.onChange({ ...props.value, labelValue: v || '' })
          }
          disabled={!labelKey}
        />
      </Grid>
    </FilterContainer>
  )
}