import {useHapticFeedback} from '@hzblj/expo-rich-haptics'
import {Box, Pressable, RnIcon} from '@hzblj/kara-ui'
import {useState} from 'react'

import {CodeBlock, Section} from '../ui'

const STARS = [1, 2, 3, 4, 5]

/** A star rating: a selection each time it changes, nothing for a tap on the star already chosen. */
export const Rating = () => {
  const [rating, setRating] = useState(3)

  useHapticFeedback(rating, 'selection')

  return (
    <Section
      caption="Changes are compared with Object.is: a tap on the star already chosen stays silent."
      title="Rating"
    >
      <Box bg="surface.primary" borderRadius="large" row justify="center" p="s12">
        {STARS.map(star => (
          <Pressable
            accessibilityLabel={star === 1 ? '1 star' : `${star} stars`}
            key={star}
            onPress={() => setRating(star)}
            p="s8"
          >
            <RnIcon
              color={star <= rating ? 'content.accent' : 'content.quaternary'}
              name={star <= rating ? 'star-filled' : 'star'}
              size="s32"
            />
          </Pressable>
        ))}
      </Box>
      <CodeBlock code="useHapticFeedback(rating, 'selection')" />
    </Section>
  )
}
