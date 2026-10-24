import {Tabs} from '@hzblj/kara-ui/router'

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen icon="touch-app" name="(feedback)" selectedIcon="touch-app-filled" title="Feedback" />
      <Tabs.Screen icon="graphic-eq" name="patterns" selectedIcon="graphic-eq-filled" title="Patterns" />
      <Tabs.Screen icon="widgets" name="in-use" selectedIcon="widgets-filled" title="In use" />
    </Tabs>
  )
}
