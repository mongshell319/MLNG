import { FIELD_BY_KEY } from '@/lib/domain/master'
import type { Face, FieldKey } from '@/lib/domain/types'
import { Mallang } from './Mallang'

/**
 * 터줏말랑 5종 (§2.3).
 * 말랑이와 동일 조형에 틴트와 고정 소품만 더한다. 상회가 하나뿐인 마을에서도
 * 이 다섯이 기본 주민이라 마을이 비어 보이지 않는다.
 */
export function Keeper({
  field,
  size = 80,
  face = 'glad',
  className,
  style,
}: {
  field: FieldKey
  size?: number
  face?: Face
  className?: string
  style?: React.CSSProperties
}) {
  const def = FIELD_BY_KEY[field]
  return (
    <Mallang
      color={def.tint}
      face={face}
      size={size}
      accessory={def.keeperAccessory}
      // 불꽃말랑의 소품은 망토라서 형태 레이어로 붙는다.
      form={field === 'challenge' ? 'fire' : 'base'}
      className={className}
      style={style}
      title={def.keeper}
    />
  )
}

export function keeperName(field: FieldKey): string {
  return FIELD_BY_KEY[field].keeper
}
