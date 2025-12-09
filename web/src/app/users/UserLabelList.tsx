import React, { ReactElement, Suspense, useState } from 'react'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import makeStyles from '@mui/styles/makeStyles'
import { gql, useQuery } from 'urql'
import CreateFAB from '../lists/CreateFAB'
import OtherActions from '../util/OtherActions'

import UserLabelSetDialog from './UserLabelCreateDialog'
import UserLabelEditDialog from './UserLabelEditDialog'
import UserLabelDeleteDialog from './UserLabelDeleteDialog'
import { Label } from '../../schema'
import Spinner from '../loading/components/Spinner'
import { useIsWidthDown } from '../util/useWidth'
import { Add } from '@mui/icons-material'
import CompList from '../lists/CompList'
import { CompListItemText } from '../lists/CompListItems'

const query = gql`
  query ($userID: ID!) {
    user(id: $userID) {
      id # need to tie the result to the correct record
      labels {
        key
        value
      }
    }
  }
`

const sortItems = (a: Label, b: Label): number => {
  if (a.key.toLowerCase() < b.key.toLowerCase()) return -1
  if (a.key.toLowerCase() > b.key.toLowerCase()) return 1
  if (a.key < b.key) return -1
  if (a.key > b.key) return 1
  return 0
}

const useStyles = makeStyles({ spacing: { marginBottom: 96 } })

export default function UserLabelList(props: {
  userID: string
}): JSX.Element {
  const [create, setCreate] = useState(false)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [deleteKey, setDeleteKey] = useState<string | null>(null)
  const isMobile = useIsWidthDown('md')
  const classes = useStyles()

  const [{ data, fetching }] = useQuery({
    query,
    variables: { userID: props.userID },
  })

  if (!data && fetching) {
    return <Spinner />
  }

  function renderList(labels: Label[]): ReactElement {
    return (
      <CompList
        data-cy='label-list'
        emptyMessage='No labels exist for this user.'
        note='Labels are a way to associate users with teams, departments, or other organizational units throughout GoAlert. Search using the format key1/key2=value'
        action={
          isMobile ? undefined : (
            <Button
              variant='contained'
              onClick={() => setCreate(true)}
              startIcon={<Add />}
              data-testid='create-label'
            >
              Create Label
            </Button>
          )
        }
      >
        {(labels || [])
          .slice()
          .sort(sortItems)
          .map((label) => (
            <CompListItemText
              key={label.key}
              title={label.key}
              subText={label.value}
              action={
                <OtherActions
                  actions={[
                    {
                      label: 'Edit',
                      onClick: () => setEditKey(label.key),
                    },
                    {
                      label: 'Delete',
                      onClick: () => setDeleteKey(label.key),
                    },
                  ]}
                />
              }
            />
          ))}
      </CompList>
    )
  }

  return (
    <React.Fragment>
      <Grid item xs={12} className={classes.spacing}>
        <Card>
          <CardContent>{renderList(data.user.labels)}</CardContent>
        </Card>
      </Grid>
      {isMobile && (
        <CreateFAB onClick={() => setCreate(true)} title='Add Label' />
      )}

      <Suspense>
        {create && (
          <UserLabelSetDialog
            userID={props.userID}
            onClose={() => setCreate(false)}
          />
        )}
        {editKey && (
          <UserLabelEditDialog
            userID={props.userID}
            labelKey={editKey}
            onClose={() => setEditKey(null)}
          />
        )}
        {deleteKey && (
          <UserLabelDeleteDialog
            userID={props.userID}
            labelKey={deleteKey}
            onClose={() => setDeleteKey(null)}
          />
        )}
      </Suspense>
    </React.Fragment>
  )
}