module.exports = {
  mode: 'jit',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    fontFamily: {
      sans: ['Poppins', 'sans-serif']
    },
    colors: {
      blue: {
        50: '#E3F2FD',
        100: '#BBDEFB',
        200: '#90C9F9',
        300: '#63B4F6',
        400: '#42A4F5',
        500: '#2196F3',
        600: '#1F87E5',
        700: '#1A75D2',
        800: '#1764C0',
        900: '#1045A1'
      },
      red: {
        50: '#FFEBEF',
        100: '#FFCDD4',
        200: '#F39A9C',
        300: '#EB7276',
        400: '#F64F53',
        500: '#FC3C39',
        600: '#ED3237',
        700: '#DB2732',
        800: '#CE1F2B',
        900: '#BF0C1E'
      },
      gray: {
        50: '#F6F7F9',
        100: '#EEF0F2',
        200: '#E1E5EB',
        300: '#D4DBE4',
        400: '#C3CED7',
        500: '#ACBED0',
        600: '#939FB2',
        700: '#606E81',
        800: '#404B5A',
        900: '#181D25'
      },
      green: {
        50: '#E5F9EA',
        100: '#C2EFCC',
        200: '#98E5AB',
        300: '#66DB87',
        400: '#33D26B',
        500: '#00C94E',
        600: '#00B944',
        700: '#00A637',
        800: '#00942A',
        900: '#007415'
      },
      orange: {
        50: '#FAD4B3',
        100: '#F8C9A0',
        200: '#F7BE8D',
        300: '#F6B379',
        400: '#F4A966',
        500: '#F2994A',
        600: '#F29340',
        700: '#F0882D',
        800: '#EF7E1A',
        900: '#E57310'
      },
      yellow: {
        50: '#F9E8B3',
        100: '#F8E2A0',
        200: '#F6DC8D',
        300: '#F5D67A',
        400: '#F4D067',
        500: '#F5CA22',
        600: '#F1C541',
        700: '#EFBF2E',
        800: '#EEB91B',
        900: '#E4AF11'
      },
      purple: {
        50: '#432D86',
        100: '#cbc1f5',
        200: '#b4a7ed',
        300: '#9887df',
        400: '#816bd0',
        500: '#674ebc',
        600: '#4f33a6',
        700: '#391b8e',
        800: '#230472',
        900: '#0e0052',
      },
      brown: {
        500: '#916000'
      },
      transparent: 'transparent',
      white: '#FFFFFF',
      black: '#000000',
      lightGray: '#F8F9FA'	
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '10px',
      },
    },
    extend: {
      colors: {
        custom: {
            DEFAULT: '#10B981',
            light: '#D1FAE5'
        }
      },
      screens: {
        '2xl': '1280px'
      },
      width: {
        '3xl': '48rem', /* 768px */
        '5xl': '64rem', /* 1024px */
        '6xl': '72rem', /* 1152px */
        '7xl': '80rem', /* 1280px */
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
  ]
}

