import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import AIRefactorPanel from '../AIRefactorPanel'

test('opens and closes the refactor modal', () => {
  const onRefactor = jest.fn()
  const onChatMessage = jest.fn()
  render(
    <AIRefactorPanel
      onRefactor={onRefactor}
      isRefactoring={false}
      currentCode={'code'}
      onChatMessage={onChatMessage}
      isChatting={false}
      chatMessages={[]}
    />
  )

  const openBtn = screen.getByRole('button', { name: /open refactor/i })
  fireEvent.click(openBtn)
  expect(screen.getByRole('dialog')).toBeInTheDocument()

  const cancelBtn = screen.getByRole('button', { name: /cancel/i })
  fireEvent.click(cancelBtn)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('labels render and refactor works', () => {
  const onRefactor = jest.fn()
  const onChatMessage = jest.fn()
  render(
    <AIRefactorPanel
      onRefactor={onRefactor}
      isRefactoring={false}
      currentCode={'code'}
      onChatMessage={onChatMessage}
      isChatting={false}
      chatMessages={[]}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: /open refactor/i }))
  expect(screen.getByText(/ai chat/i)).toBeInTheDocument()
  expect(screen.getByText(/ai refactor/i)).toBeInTheDocument()
  expect(screen.getByText(/examples/i)).toBeInTheDocument()

  const textarea = screen.getByLabelText(/refactor instructions/i)
  fireEvent.change(textarea, { target: { value: 'Add error handling' } })
  fireEvent.click(screen.getByRole('button', { name: /generate refactored code/i }))
  expect(onRefactor).toHaveBeenCalledWith('Add error handling')
})

test('keyboard Escape closes modal', () => {
  const onRefactor = jest.fn()
  render(
    <AIRefactorPanel
      onRefactor={onRefactor}
      isRefactoring={false}
      currentCode={'code'}
      onChatMessage={() => {}}
      isChatting={false}
      chatMessages={[]}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: /open refactor/i }))
  const dialog = screen.getByRole('dialog')
  fireEvent.keyDown(dialog, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})