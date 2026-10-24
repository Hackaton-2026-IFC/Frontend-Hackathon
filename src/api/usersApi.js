import api from './config'

const usersApi = {
  search: (name) =>
    api.get('usuarios/', {
      params: {
        search: name,
      },
    }),
}

export default usersApi