
import {
  mdiFolder,
  mdiSchool,
  mdiBookOpenPageVariant,
  mdiBriefcase,
  mdiLaptop,
  mdiDumbbell,
  mdiHeartPulse,
  mdiTarget,
  mdiRocketLaunch,
  mdiHome,
  mdiAirplane,
  mdiCar,
  mdiCamera,
  mdiMusic,
  mdiGamepadVariant,
} from '@mdi/js'

// Ícones disponíveis para seleção.
// "value" corresponde ao valor aceito pelo Django.
// "path" contém o desenho SVG do ícone.

export const mdi = [
  {
    value: '',
    label: 'Padrão',
    path: mdiFolder,
  },
  {
    value: 'school',
    label: 'Educação',
    path: mdiSchool,
  },
  {
    value: 'book-open-page-variant',
    label: 'Estudos',
    path: mdiBookOpenPageVariant,
  },
  {
    value: 'briefcase',
    label: 'Trabalho',
    path: mdiBriefcase,
  },
  {
    value: 'laptop',
    label: 'Tecnologia',
    path: mdiLaptop,
  },
  {
    value: 'dumbbell',
    label: 'Esportes',
    path: mdiDumbbell,
  },
  {
    value: 'heart-pulse',
    label: 'Saúde',
    path: mdiHeartPulse,
  },
  {
    value: 'target',
    label: 'Metas',
    path: mdiTarget,
  },
  {
    value: 'rocket-launch',
    label: 'Inovação',
    path: mdiRocketLaunch,
  },
  {
    value: 'folder',
    label: 'Pasta',
    path: mdiFolder,
  },
  {
    value: 'home',
    label: 'Casa',
    path: mdiHome,
  },
  {
    value: 'airplane',
    label: 'Viagens',
    path: mdiAirplane,
  },
  {
    value: 'car',
    label: 'Automóveis',
    path: mdiCar,
  },
  {
    value: 'camera',
    label: 'Fotografia',
    path: mdiCamera,
  },
  {
    value: 'music',
    label: 'Música',
    path: mdiMusic,
  },
  {
    value: 'gamepad-variant',
    label: 'Jogos',
    path: mdiGamepadVariant,
  },
]

// Retorna o caminho SVG do ícone escolhido.
// Caso o valor seja inválido, utiliza a pasta padrão.

export function getProjectIcon(value) {
  return (
    mdi.find((icon) => icon.value === value)?.path
    ?? mdiFolder
  )
}
