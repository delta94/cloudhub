import _ from 'lodash'
import {Minion, MinionsObject} from 'src/agent_admin/type'
import {
  getWheelKeyListAll,
  getRunnerManageAllowed,
  getLocalServiceEnabledTelegraf,
  getLocalServiceStatusTelegraf,
  getLocalGrainsItems,
} from 'src/shared/apis/saltStack'

const EmptyMinion: Minion = {
  host: '',
  ip: '',
  os: '',
  osVersion: '',
  status: '',
  isCheck: false,
}

export const getMinionKeyListAllAsync = async (
  pUrl: string,
  pToken: string
): Promise<MinionsObject> => {
  try {
    const minions: MinionsObject = {}
    const info = await Promise.all([
      getWheelKeyListAll(pUrl, pToken),
      getRunnerManageAllowed(pUrl, pToken),
      getLocalGrainsItems(pUrl, pToken, ''),
    ])

    const info2 = await Promise.all([
      getLocalServiceEnabledTelegraf(
        pUrl,
        pToken,
        info[0].data.return[0].data.return.minions
      ),
      getLocalServiceStatusTelegraf(
        pUrl,
        pToken,
        info[0].data.return[0].data.return.minions
      ),
    ])

    const keyList = info[0].data.return[0].data.return.minions
    const ipList = info[1].data.return[0]
    const osList = info[2].data.return[0]

    const installList = info2[0].data.return[0]
    const statusList = info2[1].data.return[0]

    for (const k of keyList)
      minions[k] = {
        host: k,
        status: 'Accept',
        isCheck: false,
        ip: ipList[k],
        os: osList[k].os,
        osVersion: osList[k].osrelease,
        isInstall: installList[k] != true ? false : installList[k],
        isRunning: statusList[k],
      }

    return minions
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getMinionKeyListAll = async (
  pUrl: string,
  pToken: string
): Promise<MinionsObject> => {
  try {
    const minions: MinionsObject = {}
    const {data} = await getWheelKeyListAll(pUrl, pToken)

    for (const k of data.return[0].data.return.minions)
      minions[k] = {
        ...EmptyMinion,
        host: k,
        status: 'Accept',
      }

    for (const k of data.return[0].data.return.minions_pre)
      minions[k] = {
        ...EmptyMinion,
        host: k,
        status: 'UnAccept',
      }

    for (const k of data.return[0].data.return.minions_rejected)
      minions[k] = {
        ...EmptyMinion,
        host: k,
        status: 'ReJect',
      }

    return minions
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getMinionAcceptKeyListAll = async (
  pUrl: string,
  pToken: string
): Promise<MinionsObject> => {
  try {
    const minions: MinionsObject = {}
    const {data} = await getWheelKeyListAll(pUrl, pToken)

    for (const k of data.return[0].data.return.minions)
      minions[k] = {
        ...EmptyMinion,
        host: k,
        status: 'Accept',
      }

    return minions
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getMinionsIP = async (
  pUrl: string,
  pToken: string,
  minions: MinionsObject
): Promise<MinionsObject> => {
  try {
    const newMinions = {...minions}
    const {data} = await getRunnerManageAllowed(pUrl, pToken)

    Object.keys(data.return[0]).forEach(function(k) {
      newMinions[k] = {
        host: k,
        status: newMinions[k].status,
        isCheck: newMinions[k].isCheck,
        ip: data.return[0][k],
      }
    })

    return newMinions
  } catch (error) {
    throw error
  }
}

export const getMinionsOS = async (
  pUrl: string,
  pToken: string,
  minions: MinionsObject
): Promise<MinionsObject> => {
  try {
    const newMinions = {...minions}
    const {data} = await getLocalGrainsItems(
      pUrl,
      pToken,
      _.values(newMinions)
        .map(m => m.host)
        .toString()
    )

    Object.keys(data.return[0]).forEach(function(k) {
      if (newMinions.hasOwnProperty(k)) {
        newMinions[k] = {
          host: k,
          status: newMinions[k].status,
          isCheck: newMinions[k].isCheck,
          ip: newMinions[k].ip,
          os: data.return[0][k].os,
          osVersion: data.return[0][k].osrelease,
        }
      }
    })

    return newMinions
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getTelegrafInstalled = async (
  pUrl: string,
  pToken: string,
  minions: MinionsObject
): Promise<MinionsObject> => {
  try {
    const newMinions = {...minions}
    const {data} = await getLocalServiceEnabledTelegraf(
      pUrl,
      pToken,
      Object.keys(newMinions).toString()
    )

    Object.keys(data.return[0]).forEach(function(k) {
      if (newMinions.hasOwnProperty(k)) {
        newMinions[k] = {
          host: k,
          status: newMinions[k].status,
          isCheck: newMinions[k].isCheck,
          ip: newMinions[k].ip,
          os: newMinions[k].os,
          osVersion: newMinions[k].osVersion,
          isInstall: data.return[0][k] != true ? false : data.return[0][k],
        }
      }
    })
    return newMinions
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getTelegrafServiceStatus = async (
  pUrl: string,
  pToken: string,
  minions: MinionsObject
): Promise<MinionsObject> => {
  try {
    const newMinions = {...minions}
    const {data} = await getLocalServiceStatusTelegraf(
      pUrl,
      pToken,
      Object.keys(newMinions).toString()
    )

    Object.keys(data.return[0]).forEach(function(k) {
      if (newMinions.hasOwnProperty(k)) {
        newMinions[k] = {
          host: k,
          status: newMinions[k].status,
          isCheck: newMinions[k].isCheck,
          ip: newMinions[k].ip,
          os: newMinions[k].os,
          osVersion: newMinions[k].osVersion,
          isInstall: newMinions[k].isInstall,
          isRunning: data.return[0][k],
        }
      }
    })
    return newMinions
  } catch (error) {
    console.error(error)
    throw error
  }
}
