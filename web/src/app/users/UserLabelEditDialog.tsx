import React, { useState } from 'react'
import { gql, useQuery, useMutation } from 'urql'
import { fieldErrors, nonFieldErrors } from '../util/errutil'

import FormDialog from '../dialogs/FormDialog'
import UserLabelForm from './UserLabelForm'
import Spinner from '../loading/components/Spinner'
import { Label } from '../../schema'

const mutation = gql`
  mutation ($input: SetLabelInput!) {
    setLabel(input: $input)
  }
`
const query = gql`
  query ($userID: ID!) {
    user(id: $userID) {
      id
      labels {
        key
        value
      }
    }
  }
`

export default function UserLabelEditDialog(props: {
  userID: string
  labelKey: string
  onClose: () => void
}): JSX.Element {
  const { onClose, labelKey, userID } = props
  const [value, setValue] = useState<Label | null>(null)

  const [{ data, fetching }] = useQuery({
    query,
    variables: { userID },
  })

  const [updateLabelStatus, updateLabel] = useMutation(mutation)

  if (!data && fetching) {
    return <Spinner />
  }

  const defaultValue = {
    key: labelKey,
    value: data?.user?.labels?.find((l: Label) => l.key === labelKey).value,
  }

  return (
    <FormDialog
      title='Update Label Value'
      loading={updateLabelStatus.fetching}
      errors={nonFieldErrors(updateLabelStatus.error)}
      onClose={onClose}
      onSubmit={() => {
        if (!value) {
          return onClose()
        }
        updateLabel(
          {
            input: {
              key: labelKey,
              value: value?.value,
              target: { type: 'user', id: userID },
            },
          },
          {
            additionalTypenames: ['User'],
          },
        ).then((res) => {
          if (res.error) return
          props.onClose()
        })
      }}
      form={
        <UserLabelForm
          errors={fieldErrors(updateLabelStatus.error)}
          editValueOnly
          disabled={updateLabelStatus.fetching}
          value={value || defaultValue}
          onChange={(value: Label) => setValue(value)}
        />
      }
    />
  )
}