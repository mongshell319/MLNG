/**
 * 아트팩 컴포넌트의 타입 창구.
 *
 * 아트 파일은 .jsx 라서 TS 쪽에서 props가 전부 any 나 never 로 잡힌다. 아트 파일에
 * 타입을 붙이는 대신(그러면 원본과 달라진다) 여기서 한 번만 모양을 선언하고,
 * 앱 코드는 이 파일을 거쳐 가져다 쓴다. 선언은 ART-README 3절의 데이터 계약 그대로다.
 *
 * 이 디렉터리에서 .jsx 는 받은 그대로의 아트팩이고, .ts 는 우리가 붙인 창구다.
 */
import type { FC } from 'react'
import type { ArtCrowdMember, ArtRoom, ArtSiteId } from '@/lib/art/adapter'
import VillageSceneJsx from './VillageScene'
import FieldSceneJsx from './FieldScene'
import MalangJsx from '@/components/Malang'

export interface VillageSceneProps {
  room: ArtRoom
  width?: number
  height?: number
  /** 아트가 직접 그리는 26px 건물 이름표. TV는 32px이 필요해 끄고 따로 얹는다 */
  showLabels?: boolean
}

export interface FieldSceneProps {
  room: ArtRoom
  site: { id: ArtSiteId }
  segment: { id: string }
  width?: number
  height?: number
  crowd?: ArtCrowdMember[]
}

export interface MalangProps {
  color?: string
  face?: 'base' | 'glad' | 'full' | 'focus' | 'surprise' | 'star' | 'sleepy' | 'sleep'
  size?: number
  /** 진화 형태. 기본형은 빈 문자열이다 */
  form?: '' | 'book' | 'tinker' | 'warm' | 'fire' | 'sprout'
  acc?: string | null
  className?: string
  style?: React.CSSProperties
}

export const VillageScene = VillageSceneJsx as FC<VillageSceneProps>
export const FieldScene = FieldSceneJsx as FC<FieldSceneProps>
export const Malang = MalangJsx as FC<MalangProps>
