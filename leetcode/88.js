/** 合并两个有序数组
 * @param {number[]} nums1
 * @param {number} m
 * @param {number[]} nums2
 * @param {number} n
 * @return {void} Do not return anything, modify nums1 in-place instead.
 */
/* var merge = function (nums1, m, nums2, n) {
    for (let i = m; i < m + n; i++) {
        nums1[i] = nums2[i - m]
    }
    for (let j = 0; j < m + n; j++) {
        for (let i = 0; i < m + n; i++) {
            if (nums1[i] > nums1[i + 1]) {
                let t = nums1[i]
                nums1[i] = nums1[i + 1]
                nums1[i + 1] = t
            }
        }
    }
    return nums1
}; */

var merge = function (nums1, m, nums2, n) {
    let i = m-1
    let j = n-1
    let k = m+n-1
    while(i>=0&&j>=0){
     if(nums1[i]>nums2[j]){
         nums1[k]=nums1[i]
         i--
     }
     else{
         nums1[k]=nums2[j]
         j--
     }
     k--
    }
    while(j>=0){
     nums1[k--]=nums2[j--]
    }
 
 };