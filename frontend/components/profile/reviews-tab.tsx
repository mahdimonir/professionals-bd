import { Calendar, Edit2, Loader2, Plus, Star, Trash2, User as UserIcon } from 'lucide-react';

interface ReviewsTabProps {
  reviewsLoading: boolean;
  reviews: any[];
  setShowNewReviewModal: (show: boolean) => void;
  editingReview: string | null;
  setEditingReview: (id: string | null) => void;
  editRating: number;
  setEditRating: (rating: number) => void;
  editComment: string;
  setEditComment: (comment: string) => void;
  handleUpdateReview: (reviewId: string) => void;
  openDeleteConfirm: (reviewId: string) => void;
  handleEditReview: (review: any) => void;
}

export function ReviewsTab({
  reviewsLoading,
  reviews,
  setShowNewReviewModal,
  editingReview,
  setEditingReview,
  editRating,
  setEditRating,
  editComment,
  setEditComment,
  handleUpdateReview,
  openDeleteConfirm,
  handleEditReview,
}: ReviewsTabProps) {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reviews</h2>
          <p className="text-sm text-slate-500">Your reviews</p>
        </div>
        <button
          onClick={() => setShowNewReviewModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors flex items-center gap-2 mr-12 mb-3"
        >
          <Plus className="w-4 h-4" />
          Write Review
        </button>
      </div>
      {reviewsLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-12 h-12 animate-spin text-slate-400" /></div>
      ) : reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review: any) => (
            <div key={review.id} className="p-5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              {editingReview === review.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon className="w-4 h-4 text-primary-500" />
                    <p className="font-bold text-slate-900 dark:text-white">
                      {review.booking?.professional?.name || 'Professional'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setEditRating(star)} className="p-1">
                          <Star className={`w-6 h-6 ${star <= editRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Comment</label>
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm resize-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingReview(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold">Cancel</button>
                    <button onClick={() => handleUpdateReview(review.id)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold">Save</button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <UserIcon className="w-4 h-4 text-primary-500" />
                        <p className="font-bold text-slate-900 dark:text-white">
                          {review.booking?.professional?.name || 'Professional'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                        ))}
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">{review.rating}/5</span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{review.comment}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditReview(review)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => openDeleteConfirm(review.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">No Reviews Yet</h3>
          <p className="text-sm text-slate-500">You haven't reviewed any professionals yet</p>
        </div>
      )}
    </div>
  );
}
