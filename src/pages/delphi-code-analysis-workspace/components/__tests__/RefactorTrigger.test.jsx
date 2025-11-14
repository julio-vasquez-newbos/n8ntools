import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import AIRefactorPanel from '../AIRefactorPanel'
import JavaScriptEditor from '../JavaScriptEditor'

test('Refactor button opens AI Refactor modal via event', () => {
  render(
    <div>
      <JavaScriptEditor
        code={''}
        onCodeChange={() => {}}
        onExecute={() => {}}
        isProcessing={false}
        executionStatus={'idle'}
      />
      <AIRefactorPanel
        onRefactor={() => {}}
        isRefactoring={false}
        currentCode={''}
        onChatMessage={() => {}}
        isChatting={false}
        chatMessages={[]}
      />
    </div>
  )

  const btn = screen.getByRole('button', { name: /refactor/i })
  fireEvent.click(btn)
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})