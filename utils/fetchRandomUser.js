const axios = require('axios');

const fetchRandomUser = async () => {
    try {
        const response = await axios.get('https://randomuser.me/api/');
        const user = response.data.results[0];
        return {
            id: user.login.uuid,
            nombre: `${user.name.first} ${user.name.last}`,
            email: user.email,
            debe: 0,
            recibe: 0
        };
    } catch (error) {
        console.error('Error fetching random user:', error);
        throw error;
    }
};

module.exports = fetchRandomUser;
