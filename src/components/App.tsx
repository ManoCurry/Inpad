import React, { useMemo } from 'react'
import Router from './Router'
import GlobalStyle from './GlobalStyle'
import { ThemeProvider } from 'styled-components'
import { legacyTheme } from '../themes/legacy'
import { darkTheme } from '../themes/dark'
import { lightTheme } from '../themes/light'
import { sepiaTheme } from '../themes/sepia'
import { solarizedDarkTheme } from '../themes/solarizedDark'
import Dialog from './organisms/Dialog'
import { useDb } from '../lib/db'
import PreferencesModal from './PreferencesModal/PreferencesModal'
import { useGlobalKeyDownHandler, isWithGeneralCtrlKey } from '../lib/keyboard'
import { usePreferences } from '../lib/preferences'
import '../lib/i18n'
import '../lib/analytics'
import CodeMirrorStyle from './CodeMirrorStyle'
import ToastList from './Toast'
import styled from '../lib/styled'
import { useEffectOnce } from 'react-use'
import FeatureCheckListPopup from './organisms/FeatureCheckListPopup'
import TopLevelNavigator from './organisms/TopLevelNavigator'

const LoadingText = styled.div`
  margin: 30px;
`

const AppContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  display: flex;
`

const App = () => {
  const { initialize, initialized, queueSyncingAllStorage } = useDb()

  useEffectOnce(() => {
    initialize()
      .then(() => {
        queueSyncingAllStorage(0)
      })
      .catch((error) => {
        console.error(error)
      })
  })

  const { toggleClosed, preferences } = usePreferences()
  const keyboardHandler = useMemo(() => {
    return (event: KeyboardEvent) => {
      switch (event.key) {
        case ',':
          if (isWithGeneralCtrlKey(event)) {
            toggleClosed()
          }
          break
        case 'a':
          if (isWithGeneralCtrlKey(event) && event.target != null) {
            const targetElement = event.target as HTMLElement
            const windowSelection = window.getSelection()
            if (
              targetElement.classList.contains('MarkdownPreviewer') &&
              windowSelection != null
            ) {
              event.preventDefault()
              const range = document.createRange()
              range.selectNode(targetElement)
              windowSelection.addRange(range)
            }
          }
          break
      }
    }
  }, [toggleClosed])
  useGlobalKeyDownHandler(keyboardHandler)

  return (
    <ThemeProvider theme={selectTheme(preferences['general.theme'])}>
      <AppContainer
        onDrop={(event: React.DragEvent) => {
          event.preventDefault()
        }}
      >
        {initialized ? (
          <>
            {preferences['general.showTopLevelNavigator'] && (
              <TopLevelNavigator />
            )}
            <Router />
          </>
        ) : (
          <LoadingText>Loading Data...</LoadingText>
        )}
        <GlobalStyle />
        <Dialog />
        <PreferencesModal />
        <ToastList />
        <CodeMirrorStyle />
        <FeatureCheckListPopup />
      </AppContainer>
    </ThemeProvider>
  )
}
function selectTheme(theme: string) {
  switch (theme) {
    case 'legacy':
      return legacyTheme
    case 'light':
      return lightTheme
    case 'sepia':
      return sepiaTheme
    case 'solarizedDark':
      return solarizedDarkTheme
    case 'dark':
    default:
      return darkTheme
  }
}

export default App
