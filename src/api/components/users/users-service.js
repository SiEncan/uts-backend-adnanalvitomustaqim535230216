const usersRepository = require('./users-repository');
const { hashPassword, passwordMatched } = require('../../../utils/password');

/**
 * Get list of users
 * @param {string} queryParams - Query Parameter for Pagination, Sorting, and Search
 * @returns {Object}
 */
async function getUsers(queryParams) {
  // cek apakah format sort dan search valid
  const { validSort, validSearch, regexPattern } =
    validateQueryParams(queryParams);

  // membuat object query untuk search user
  let searchUserQuery = {};
  let sortUserQuery = {};

  // Search
  // jika format query search valid tambahkan regexpattern ke object query
  if (validSearch) searchUserQuery[queryParams.searchFieldName] = regexPattern;

  // Sort
  // jika format query sort valid tambahkan regexpattern ke object query
  sortUserQuery[validSort ? queryParams.sortFieldName : 'email'] = validSort
    ? queryParams.sortOrder
    : 'asc';

  // ambil data user dengan search dan sort query
  const users = await usersRepository.getUsers(searchUserQuery, sortUserQuery);

  // Pagination
  // saya tidak menggunakan pagination dengan MongoDB (skip, limit) karena ketika ingin mendapatkan count (total data tanpa pagination)
  // harus memanggil database lagi untuk mendapatkan count (total data tanpa pagination)
  // dan menurut saya memanggil database 2x hanya untuk mendapatkan (count total data) adalah cara yang tidak efisien
  const { pageSize, pageNumber, startIndex, endIndex, totalPage } =
    paginateUser(queryParams.pageNumber, queryParams.pageSize, users.length);

  const results = [];
  // memasukkan semua data user yang sudah difilter dan sort ke dalam results
  for (let i = startIndex; i < endIndex; i++) {
    const user = users[i];
    results.push({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  }
  return {
    page_number: pageNumber,
    page_size: pageSize,
    count: users.length,
    total_pages: totalPage,
    has_previous_page: queryParams.pageNumber > 1,
    has_next_page: queryParams.pageNumber < totalPage && totalPage > 1,
    data: results,
  };
}

/**
 * Get user detail
 * @param {string} id - User ID
 * @returns {Object}
 */
async function getUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {boolean}
 */
async function createUser(name, email, password, pin) {
  // Hash password
  const hashedPassword = await hashPassword(password);

  try {
    await usersRepository.createUser(name, email, hashedPassword);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Update existing user
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {boolean}
 */
async function updateUser(id, name, email) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.updateUser(id, name, email);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {boolean}
 */
async function deleteUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.deleteUser(id);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Check whether the email is registered
 * @param {string} email - Email
 * @returns {boolean}
 */
async function emailIsRegistered(email) {
  const user = await usersRepository.getUserByEmail(email);

  if (user) {
    return true;
  }

  return false;
}

/**
 * Check whether the password is correct
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function checkPassword(userId, password) {
  const user = await usersRepository.getUser(userId);
  return passwordMatched(password, user.password);
}

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function changePassword(userId, password) {
  const user = await usersRepository.getUser(userId);

  // Check if user not found
  if (!user) {
    return null;
  }

  const hashedPassword = await hashPassword(password);

  const changeSuccess = await usersRepository.changePassword(
    userId,
    hashedPassword
  );

  if (!changeSuccess) {
    return null;
  }

  return true;
}

/**
 * Validate Query Params
 * @param {string} queryParams - Query Parameter for Pagination, Sorting, and Search
 * @returns {boolean, RegExp}
 */
function validateQueryParams(queryParams) {
  const validSort =
    (queryParams.sortOrder === 'desc' || queryParams.sortOrder === 'asc') &&
    (queryParams.sortFieldName === 'name' ||
      queryParams.sortFieldName === 'email');
  const validSearch =
    (queryParams.searchFieldName === 'name' ||
      queryParams.searchFieldName === 'email') &&
    queryParams.searchKey;

  // Membuat object regex untuk search filter dengan option case insensitive
  const regexPattern = new RegExp(queryParams.searchKey, 'i');

  return { validSort, validSearch, regexPattern };
}

function paginateUser(pageNumber_query, pageSize_query, users_length) {
  const pageNumber = pageNumber_query ? pageNumber_query : 1;
  const pageSize = pageSize_query ? pageSize_query : users_length;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, users_length);
  const totalPage = Math.ceil(users_length / pageSize);

  return { pageNumber, pageSize, startIndex, endIndex, totalPage };
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  emailIsRegistered,
  checkPassword,
  changePassword,
};
