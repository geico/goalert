import React, { useState } from 'react'
import { gql, useMutation } from 'urql'
import { fieldErrors, nonFieldErrors } from '../util/errutil'
import FormDialog from '../dialogs/FormDialog'
import UserLabelForm from './UserLabelForm'
import { Label } from '../../schema'

const mutation = gql`
  mutation ($input: SetLabelInput!) {
    setLabel(input: $input)
  }
`

interface UserLabelCreateDialogProps {
  userID: string
  onClose: () => void
}

export default function UserLabelCreateDialog(
  props: UserLabelCreateDialogProps,
): JSX.Element {
  const [value, setValue] = useState<Label>({ key: '', value: '' })

  const [{ error }, commit] = useMutation(mutation)

  return (
    <FormDialog
      title='Set Label Value'
      errors={nonFieldErrors(error)}
      onClose={props.onClose}
      onSubmit={() =>
        commit(
          {
            input: {
              ...value,
              target: { type: 'user', id: props.userID },
            },
          },
          {
            additionalTypenames: ['User'],
          },
        ).then((result) => {
          if (!result.error) props.onClose()
        })
      }
      form={
        <UserLabelForm
          errors={fieldErrors(error)}
          value={value}
          onChange={(val: Label) => setValue(val)}
        />
      }
    />
  )
}