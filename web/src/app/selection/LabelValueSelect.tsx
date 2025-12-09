import { gql } from 'urql'
import { makeQuerySelect } from './QuerySelect'

const query = gql`
  query ($input: LabelValueSearchOptions) {
    labelValues(input: $input) {
      nodes
    }
  }
`
interface LabelValueSearchProps {
  label: string
  disabled: boolean
  name: string
}

export const LabelValueSelect = makeQuerySelect('LabelValueSelect', {
  query,
  extraVariablesFunc: ({
    labelKey: key,
    targetType,
    ...props
  }: {
    labelKey: string
    targetType?: string
    props: LabelValueSearchProps
  }) => [props, { key, targetType }],
  mapDataNode: (value: string) => ({ label: value, value }),
})
