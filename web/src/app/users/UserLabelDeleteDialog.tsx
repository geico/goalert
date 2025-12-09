import React from 'react'
import { gql, useMutation } from 'urql'
import { nonFieldErrors } from '../util/errutil'
import FormDialog from '../dialogs/FormDialog'

const mutation = gql`
  mutation ($input: SetLabelInput!) {
    setLabel(input: $input)
  }
`

export default function UserLabelDeleteDialog(props: {
  userID: string
  labelKey: string
  onClose: () => void
}): JSX.Element {
  const { labelKey, onClose, userID } = props

  const [deleteLabelStatus, deleteLabel] = useMutation(mutation)

  return (
    <FormDialog
      title='Are you sure?'
      confirm
      subTitle={`This will delete the label: ${labelKey}`}
      loading={deleteLabelStatus.fetching}
      errors={nonFieldErrors(deleteLabelStatus.error)}
      onClose={onClose}
      onSubmit={() => {
        deleteLabel(
          {
            input: {
              key: labelKey,
              value: '',
              target: {
                type: 'user',
                id: userID,
              },
            },
          },
          { additionalTypenames: ['User'] },
        ).then((res) => {
          if (res.error) return
          props.onClose()
        })
      }}
    />
  )
}