import React, { Suspense, useState } from 'react'
import { gql, useQuery } from 'urql'
import { UserAvatar } from '../util/avatars'
import UserFilterContainer from './UserFilterContainer'
import UserCreateDialog from './UserCreateDialog'
import { useSessionInfo } from '../util/RequireConfig'
import ListPageControls from '../lists/ListPageControls'
import Search from '../util/Search'
import { UserConnection } from '../../schema'
import { useURLParam } from '../actions'
import { FavoriteIcon } from '../util/SetFavoriteButton'
import { CompListItemNav } from '../lists/CompListItems'
import CompList from '../lists/CompList'
import getUserFilters from '../util/getUserFilters'

const query = gql`
  query usersQuery($input: UserSearchOptions) {
    users(input: $input) {
      nodes {
        id
        name
        email
        isFavorite
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

const context = { suspense: false }

function UserList(): JSX.Element {
  const { isAdmin } = useSessionInfo()
  const [create, setCreate] = useState(false)
  const [search, setSearch] = useURLParam<string>('search', '')
  const [cursor, setCursor] = useState('')

  const { labelKey, labelValue, phoneNumber } = getUserFilters(search)

  const inputVars = {
    favoritesFirst: true,
    search: labelKey ? labelKey + '=' + labelValue : '',
    CMValue: phoneNumber,
    after: cursor,
  }

  const [q] = useQuery<{ users: UserConnection }>({
    query,
    variables: { input: inputVars },
    context,
  })
  const nextCursor = q.data?.users.pageInfo.hasNextPage
    ? q.data?.users.pageInfo.endCursor
    : ''
  // cache the next page
  useQuery({
    query,
    variables: { input: { ...inputVars, after: nextCursor } },
    context,
    pause: !nextCursor,
  })

  return (
    <React.Fragment>
      <Suspense>
        {create && <UserCreateDialog onClose={() => setCreate(false)} />}
      </Suspense>
      <ListPageControls
        createLabel='User'
        nextCursor={nextCursor}
        onCursorChange={setCursor}
        loading={q.fetching}
        onCreateClick={isAdmin ? () => setCreate(true) : undefined}
        slots={{
          search: (
            <Search 
              endAdornment={
                <UserFilterContainer 
                  value={{ labelKey, labelValue, phoneNumber }}
                  onChange={({ labelKey, labelValue, phoneNumber }) => {
                    const labelSearch = labelKey
                      ? labelKey + '=' + labelValue
                      : ''
                    const phoneSearch = phoneNumber 
                      ? 'phone=' + phoneNumber
                      : ''
                    
                    // Combine searches with space if both exist
                    const combinedSearch = [labelSearch, phoneSearch]
                      .filter(s => s)
                      .join(' ')
                    
                    setSearch(combinedSearch)
                  }}
                  onReset={() => {
                    setSearch('')
                  }}
                />
              } 
            />
          ),
          list: (
            <CompList emptyMessage='No results'>
              {q.data?.users.nodes.map((u) => (
                <CompListItemNav
                  key={u.id}
                  title={u.name}
                  subText={u.email}
                  url={u.id}
                  action={u.isFavorite ? <FavoriteIcon /> : undefined}
                  icon={<UserAvatar userID={u.id} />}
                />
              ))}
            </CompList>
          ),
        }}
      />
    </React.Fragment>
  )
}

export default UserList
