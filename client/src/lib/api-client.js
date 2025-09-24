import { HOST } from '@/utils/constansts'
import axios from 'axios'


export const apiClient = axios.create({
    baseURL: HOST
})