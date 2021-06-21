import map from 'lodash/fp/map'
import flatMap from 'lodash/fp/flatMap'
import fromPairs from 'lodash/fp/fromPairs'
import flow from 'lodash/fp/flow'
import { api } from '@soramitsu/soraneo-wallet-web'

const types = flow(
  flatMap(x => [x + '_REQUEST', x + '_SUCCESS', x + '_FAILURE']),
  map(x => [x, x]),
  fromPairs
)([
  'GET_ACCOUNT_LIQUIDITY',
  'UPDATE_ACCOUNT_LIQUIDITY'
])

let updateLiquidityIntervalId: any = null

function initialState () {
  return {
    accountLiquidity: [],
    accountLiquidityFetching: false
  }
}

const state = initialState()

const getters = {
  accountLiquidity (state) {
    return state.accountLiquidity
  }
}

const mutations = {
  [types.GET_ACCOUNT_LIQUIDITY_REQUEST] (state) {
    state.accountLiquidity = []
    state.accountLiquidityFetching = true
  },

  [types.GET_ACCOUNT_LIQUIDITY_SUCCESS] (state, liquidity) {
    state.accountLiquidity = []
    state.accountLiquidity = liquidity
    state.accountLiquidityFetching = false
  },

  [types.GET_ACCOUNT_LIQUIDITY_FAILURE] (state) {
    state.accountLiquidity = []
    state.accountLiquidityFetching = false
  },

  [types.UPDATE_ACCOUNT_LIQUIDITY_REQUEST] (state) {
    state.accountLiquidityFetching = true
  },

  [types.UPDATE_ACCOUNT_LIQUIDITY_SUCCESS] (state, liquidity) {
    state.accountLiquidity = []
    state.accountLiquidity = liquidity
    state.accountLiquidityFetching = false
  },

  [types.UPDATE_ACCOUNT_LIQUIDITY_FAILURE] (state) {
    state.accountLiquidity = []
    state.accountLiquidityFetching = false
  }
}

const actions = {
  async getAccountLiquidity ({ commit, rootGetters, state }) {
    if (!rootGetters.isLoggedIn || state.accountLiquidityFetching) {
      return
    }
    commit(types.GET_ACCOUNT_LIQUIDITY_REQUEST)
    try {
      await api.getKnownAccountLiquidity()
      commit(types.GET_ACCOUNT_LIQUIDITY_SUCCESS, api.accountLiquidity)
    } catch (error) {
      commit(types.GET_ACCOUNT_LIQUIDITY_FAILURE)
    }
  },
  updateAccountLiquidity ({ commit, rootGetters, dispatch, state }) {
    dispatch('destroyUpdateAccountLiquiditySubscription')
    const fiveSeconds = 5 * 1000
    updateLiquidityIntervalId = setInterval(async () => {
      if (!rootGetters.isLoggedIn || state.accountLiquidityFetching) {
        return
      }
      commit(types.UPDATE_ACCOUNT_LIQUIDITY_REQUEST)
      try {
        // It's not a real update because we cannot add pool token by address.
        // So, we need to find all pairs every time (5 sec)
        await api.getKnownAccountLiquidity()
        commit(types.UPDATE_ACCOUNT_LIQUIDITY_SUCCESS, api.accountLiquidity)
      } catch (error) {
        commit(types.UPDATE_ACCOUNT_LIQUIDITY_FAILURE)
      }
    }, fiveSeconds)
  },
  destroyUpdateAccountLiquiditySubscription () {
    clearInterval(updateLiquidityIntervalId)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
