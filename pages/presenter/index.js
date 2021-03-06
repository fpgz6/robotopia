const html = require('choo/html')

const timerDisplay = require('../../elements/timer')
const overlayView = require('../../elements/overlay')

const gameRunnerView = require('../../elements/game-runner')
const pageLayout = require('../../elements/page-layout')

const presenterModalView = require('../../elements/presenter-dialog')
const clientsList = require('../../elements/clients-list')
const prepfight = require('action-overlay')('prepfight').view
const initialState = require('./initial-state')

const DEV_MODE = false

module.exports = function (state, prev, send) {
  let presenter = state.presenter
  let game = state.game
  let clock = state.clock

  if (presenter.groupId === null) {
    if (DEV_MODE) {
      send('presenter:joinGroup', { groupId: 'asd' })
      send('presenter:_testMode')
    }
  }

  const presenterDialog = presenterModalView({
    presenter,
    currentGame: game.current,
    onJoinGroup: (groupId) => {
      send('presenter:joinGroup', { groupId })
    },
    onPlayersPicked: (players) => {
      send('presenter:setPlayers', players)
      send('presenter:startMatch')
    },
    onCancelPlayerPicking: () => {
      send('presenter:pickPlayers', false)
      send('presenter:setTime', 0)
    },
    onCloseWinModal: () => {
      send('presenter:showWinDialog', false)
    }
  })

  const gameRunnerHtml = gameRunnerView({
    game,
    clock,
    onStart: () => {
      send('presenter:setTime', 120)
      send('presenter:pickPlayers', {playerCount: 2, selectionMode: 'pick'})
    },
    onStop: () => send('presenter:stopMatch'),
    onChangeSpeed: (value) => send('clock:setIntervalDuration', { intervalDuration: value })
  })

  const timerHtml = overlayView({
    position: 'bottom right',
    hasFrame: false,
    content: timerDisplay({ seconds: presenter.time })
  })

  const prepfightHtml = prepfight(state, prev, send)

  const clientsListHtml = overlayView({
    position: 'bottom left',
    content: clientsList({
      clients: presenter.clients,
      playerNumbers: presenter.playerNumbers
    })
  })

  const pageHtml = pageLayout({
    id: 'presenter-page',
    context: [state, prev, send],
    panels: [
      { view: gameRunnerHtml, size: 1 }
    ]
  })

  return html`
    <div onload=${init}>
      ${pageHtml}
      ${presenterDialog}
      ${presenter.time === 0 && !presenter.displayWinDialog && !presenter.displayPlayerPickScreen ? clientsListHtml : ''}
      ${timerHtml}
      ${prepfightHtml}
    </div>
  `

  function init () {
    send('clock:stop')
    send('game:loadGameState', { loadState: initialState.game })
    send('prepfight:setLeft', { img: '' })
    send('prepfight:setRight', { img: '' })
    send('prepfight:setVS', { img: 'http://vignette2.wikia.nocookie.net/mortalkombat/images/6/64/Vs.png/revision/latest?cb=20150319161124&path-prefix=de' })
    send('prepfight:setDurations', { up: 1000, down: 1000, stay: 1500 })
  }
}
