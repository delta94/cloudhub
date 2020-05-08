// Libraries
import {Dispatch} from 'react'

// APIs
import {
  getMinionKeyListAllAsync as loadMinionKeyListAll,
  getMinionKeyListAll,
  getMinionAcceptKeyListAll,
  getMinionsIP,
  getMinionsOS,
  getTelegrafInstalled,
  getTelegrafServiceStatus,
  MinionsObject,
} from 'src/agent_admin/apis'

// Error
import {errorThrown} from 'src/shared/actions/errors'
import {ErrorThrownAction} from 'src/types/actions/errors'

export const loadMinionKeyListAllAsync = (
  pUrl: string,
  pToken: string
) => async (dispatch: Dispatch<ErrorThrownAction>) => {
  try {
    return await loadMinionKeyListAll(pUrl, pToken)
  } catch (error) {
    console.error(error)
    dispatch(errorThrown(error, `${error.status} ${error.statusText}`))
  }
}

export const getMinionKeyListAllAsync = (
  pUrl: string,
  pToken: string
) => async (dispatch: Dispatch<ErrorThrownAction>) => {
  try {
    return await getMinionKeyListAll(pUrl, pToken)
  } catch (error) {
    console.error(error)
    dispatch(errorThrown(error, `${error.status} ${error.statusText}`))
  }
}

export const getMinionsIPAsync = (
  pUrl: string,
  pToken: string,
  minions: MinionsObject
) => async (dispatch: Dispatch<ErrorThrownAction>) => {
  try {
    return await getMinionsIP(pUrl, pToken, minions)
  } catch (error) {
    console.error(error)
    dispatch(errorThrown(error, `${error.status} ${error.statusText}`))
  }
}

export const getMinionAcceptKeyListAllAsync = (
  pUrl: string,
  pToken: string
) => async (dispatch: Dispatch<ErrorThrownAction>) => {
  try {
    return await getMinionAcceptKeyListAll(pUrl, pToken)
  } catch (error) {
    console.error(error)
    dispatch(errorThrown(error, `${error.status} ${error.statusText}`))
  }
}

export const getMinionsOSAsync = (
  pUrl: string,
  pToken: string,
  minions: MinionsObject
) => async (dispatch: Dispatch<ErrorThrownAction>) => {
  try {
    return await getMinionsOS(pUrl, pToken, minions)
  } catch (error) {
    console.error(error)
    dispatch(errorThrown(error, `${error.status} ${error.statusText}`))
  }
}

export const getTelegrafInstalledAsync = (
  pUrl: string,
  pToken: string,
  minions: MinionsObject
) => async (dispatch: Dispatch<ErrorThrownAction>) => {
  try {
    return await getTelegrafInstalled(pUrl, pToken, minions)
  } catch (error) {
    console.error(error)
    dispatch(errorThrown(error, `${error.status} ${error.statusText}`))
  }
}

export const getTelegrafServiceStatusAsync = (
  pUrl: string,
  pToken: string,
  minions: MinionsObject
) => async (dispatch: Dispatch<ErrorThrownAction>) => {
  try {
    return await getTelegrafServiceStatus(pUrl, pToken, minions)
  } catch (error) {
    console.error(error)
    dispatch(errorThrown(error, `${error.status} ${error.statusText}`))
  }
}
